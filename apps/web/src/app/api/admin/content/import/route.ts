import { prisma } from "@kairo/database";
import type { ContentType } from "@kairo/database";
import type { ContentSource } from "@kairo/types";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const bodySchema = z.object({
  url: z.string().url(),
  providerId: z.string().optional(),
  isKids: z.boolean().default(false),
  publishNow: z.boolean().default(true),
});

// ── Source detection ─────────────────────────────────────────
function detectSource(url: string): { sourceType: ContentSource; videoId?: string } {
  if (/youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts/.test(url)) {
    const id =
      url.match(/[?&]v=([^&#]+)/)?.[1] ??
      url.match(/youtu\.be\/([^?&#]+)/)?.[1] ??
      url.match(/shorts\/([^?&#]+)/)?.[1];
    return { sourceType: "YOUTUBE", videoId: id };
  }
  if (/vimeo\.com\//.test(url)) {
    const id = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
    return { sourceType: "VIMEO", videoId: id };
  }
  return { sourceType: "EMBED" };
}

// ── Metadata fetchers ─────────────────────────────────────────
async function fetchYouTubeMetadata(url: string) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    title: string;
    author_name: string;
    thumbnail_url: string;
    html: string;
  };
  return {
    title: data.title,
    description: `By ${data.author_name}`,
    thumbnailUrl: data.thumbnail_url,
  };
}

async function fetchVimeoMetadata(url: string) {
  const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
  const res = await fetch(oembedUrl);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    title: string;
    description: string;
    thumbnail_url: string;
    author_name: string;
    duration: number;
  };
  return {
    title: data.title,
    description: data.description || `By ${data.author_name}`,
    thumbnailUrl: data.thumbnail_url,
    duration: data.duration,
  };
}

async function fetchGenericMetadata(url: string) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Kairo/1.0" } });
    if (!res.ok) return null;
    const html = await res.text();

    const title =
      html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] ??
      html.match(/<title>([^<]+)<\/title>/i)?.[1] ??
      "Untitled";

    const description =
      html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] ??
      html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1] ??
      "";

    const thumbnailUrl =
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ?? "";

    const embedUrl =
      html.match(/<meta[^>]+property="og:video:url"[^>]+content="([^"]+)"/i)?.[1] ??
      html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+)"/i)?.[1];

    return { title, description, thumbnailUrl, embedUrl };
  } catch {
    return null;
  }
}

// ── Handler ───────────────────────────────────────────────────
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return Response.json({ error: "Invalid request", details: e }, { status: 400 });
  }

  const { sourceType, videoId } = detectSource(body.url);

  // Fetch metadata from source
  let meta: {
    title: string;
    description: string;
    thumbnailUrl: string;
    duration?: number;
    embedUrl?: string;
  } | null = null;

  if (sourceType === "YOUTUBE") {
    meta = await fetchYouTubeMetadata(body.url);
  } else if (sourceType === "VIMEO") {
    meta = await fetchVimeoMetadata(body.url);
  } else {
    meta = await fetchGenericMetadata(body.url);
  }

  if (!meta) {
    return Response.json(
      { error: "Impossible de récupérer les métadonnées. Vérifie l'URL." },
      { status: 422 }
    );
  }

  // Build embed URL
  let embedUrl = meta.embedUrl ?? null;
  if (sourceType === "YOUTUBE" && videoId) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  } else if (sourceType === "VIMEO" && videoId) {
    embedUrl = `https://player.vimeo.com/video/${videoId}?color=C9A84C&byline=0&portrait=0`;
  }

  const content = await prisma.content.create({
    data: {
      title: meta.title,
      description: meta.description || meta.title,
      type: "MOVIE" as ContentType,
      sourceType: sourceType as ContentSource,
      providerId: body.providerId ?? null,
      providerContentId: videoId ?? null,
      sourceUrl: body.url,
      embedUrl,
      thumbnailUrl: meta.thumbnailUrl || "",
      duration: meta.duration ?? null,
      isKids: body.isKids,
      status: body.publishNow ? "PUBLISHED" : "DRAFT",
      publishedAt: body.publishNow ? new Date() : null,
    },
    select: {
      id: true,
      title: true,
      sourceType: true,
      embedUrl: true,
      status: true,
    },
  });

  return Response.json(content, { status: 201 });
}
