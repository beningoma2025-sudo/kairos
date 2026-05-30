export const dynamic = "force-dynamic";

import { prisma } from "@kairo/database";
import { requireAdmin } from "@/lib/admin-auth";

export const ARCHIVE_CATEGORIES = {
  biblical_films: {
    label: "Films Bibliques",
    query: '(subject:"bible" OR subject:"biblical" OR subject:"jesus" OR subject:"christ") mediatype:movies',
  },
  christian_movies: {
    label: "Films Chrétiens",
    query: '(subject:"christian" OR subject:"christianity" OR subject:"evangelical") mediatype:movies',
  },
  billy_graham: {
    label: "Billy Graham",
    query: 'subject:"Billy Graham" mediatype:movies',
  },
  sermons: {
    label: "Sermons & Enseignements",
    query: '(subject:"sermon" OR subject:"preaching" OR subject:"gospel message") mediatype:movies',
  },
  gospel_music: {
    label: "Musique Gospel",
    query: '(subject:"gospel music" OR subject:"christian music" OR subject:"hymn") mediatype:movies',
  },
  missionaries: {
    label: "Missionnaires",
    query: '(subject:"missionary" OR subject:"missions" OR subject:"evangelism") mediatype:movies',
  },
  kids_faith: {
    label: "Enfants & Foi",
    query: '(subject:"christian children" OR subject:"bible stories" OR subject:"vacation bible") mediatype:movies',
  },
  documentaries: {
    label: "Documentaires",
    query: '(subject:"religious documentary" OR subject:"christian documentary" OR subject:"holy land") mediatype:movies',
  },
} as const;

export type ArchiveCategory = keyof typeof ARCHIVE_CATEGORIES;

interface ArchiveItem {
  identifier: string;
  title: string;
  description?: string;
  subject?: string | string[];
  year?: string | number;
  runtime?: string;
  creator?: string;
}

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  const category = url.searchParams.get("category") as ArchiveCategory | null;
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const rows = 24;

  if (!category || !ARCHIVE_CATEGORIES[category]) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }

  const { query } = ARCHIVE_CATEGORIES[category];
  const start = (page - 1) * rows;

  const params = new URLSearchParams({
    q: query,
    "fl[]": "identifier,title,description,subject,year,runtime,creator",
    rows: rows.toString(),
    start: start.toString(),
    output: "json",
    sort: "downloads desc",
  });

  const res = await fetch(`https://archive.org/advancedsearch.php?${params}`);
  if (!res.ok) return Response.json({ error: "Archive.org unreachable" }, { status: 502 });

  const data = await res.json() as {
    response: { docs: ArchiveItem[]; numFound: number };
  };

  const docs = data.response?.docs ?? [];

  // Check which identifiers are already imported
  const identifiers = docs.map((d) => d.identifier);
  const existing = await prisma.content.findMany({
    where: { providerContentId: { in: identifiers } },
    select: { providerContentId: true },
  });
  const importedSet = new Set(existing.map((e) => e.providerContentId));

  const items = docs.map((doc) => ({
    identifier: doc.identifier,
    title: doc.title ?? doc.identifier,
    description: Array.isArray(doc.description)
      ? doc.description[0]
      : (doc.description ?? ""),
    year: doc.year ?? null,
    runtime: doc.runtime ?? null,
    creator: doc.creator ?? null,
    thumbnailUrl: `https://archive.org/services/img/${doc.identifier}`,
    embedUrl: `https://archive.org/embed/${doc.identifier}`,
    sourceUrl: `https://archive.org/details/${doc.identifier}`,
    alreadyImported: importedSet.has(doc.identifier),
  }));

  return Response.json({
    items,
    total: data.response?.numFound ?? 0,
    page,
    pages: Math.ceil((data.response?.numFound ?? 0) / rows),
  });
}
