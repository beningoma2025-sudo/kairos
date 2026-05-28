import { prisma } from "@kairo/database";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: Request) {
  const body = await req.json() as {
    type: string;
    data: {
      id?: string;
      upload_id?: string;
      status?: string;
      playback_ids?: Array<{ id: string; policy: string }>;
    };
  };

  // Video asset ready — update content with real asset/playback IDs
  if (body.type === "video.asset.ready") {
    const assetId = body.data.id;
    const uploadId = body.data.upload_id;
    const playbackId = body.data.playback_ids?.[0]?.id;

    if (!assetId || !uploadId || !playbackId) return new Response(null, { status: 200 });

    // Find content that was created with the upload ID stored in muxAssetId
    const content = await prisma.content.findFirst({
      where: { muxAssetId: uploadId },
      select: { id: true },
    });

    if (content) {
      await prisma.content.update({
        where: { id: content.id },
        data: {
          muxAssetId: assetId,
          muxPlaybackId: playbackId,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });
    }
  }

  // Live stream went live — update status
  if (body.type === "video.live_stream.active") {
    const streamId = body.data.id;
    if (streamId) {
      await prisma.liveEvent.updateMany({
        where: { muxLiveStreamId: streamId },
        data: { status: "LIVE", actualStartAt: new Date() },
      });
    }
  }

  // Live stream ended
  if (body.type === "video.live_stream.idle") {
    const streamId = body.data.id;
    if (streamId) {
      await prisma.liveEvent.updateMany({
        where: { muxLiveStreamId: streamId, status: "LIVE" },
        data: { status: "ENDED", endedAt: new Date() },
      });
    }
  }

  return new Response(null, { status: 200 });
}
