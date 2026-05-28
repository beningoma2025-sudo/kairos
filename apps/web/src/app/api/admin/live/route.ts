import Mux from "@mux/mux-node";
import { prisma } from "@kairo/database";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

const createSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(2000).trim(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  scheduledStartAt: z.string().datetime(),
  channelId: z.string().optional(),
  isRecorded: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const events = await prisma.liveEvent.findMany({
    orderBy: { scheduledStartAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      status: true,
      scheduledStartAt: true,
      actualStartAt: true,
      muxStreamKey: true,
      muxPlaybackId: true,
      viewerCount: true,
      peakViewerCount: true,
      channel: { select: { name: true, slug: true } },
    },
  });

  return Response.json(events);
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  // Create Mux live stream
  const stream = await mux.video.liveStreams.create({
    playback_policy: ["public"],
    new_asset_settings: {
      playback_policy: ["public"],
    },
  });

  const playbackId = stream.playback_ids?.[0]?.id ?? "";

  const event = await prisma.liveEvent.create({
    data: {
      title: body.title,
      description: body.description,
      thumbnailUrl: body.thumbnailUrl || "",
      scheduledStartAt: new Date(body.scheduledStartAt),
      channelId: body.channelId ?? null,
      isRecorded: body.isRecorded,
      tags: body.tags,
      muxLiveStreamId: stream.id,
      muxStreamKey: stream.stream_key,
      muxPlaybackId: playbackId,
      status: "SCHEDULED",
    },
    select: {
      id: true,
      title: true,
      status: true,
      muxStreamKey: true,
      muxPlaybackId: true,
      scheduledStartAt: true,
    },
  });

  return Response.json(event, { status: 201 });
}
