import Mux from "@mux/mux-node";
import { requireAdmin } from "@/lib/admin-auth";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const upload = await mux.video.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? "*",
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "smart",
    },
  });

  return Response.json({ uploadId: upload.id, uploadUrl: upload.url });
}
