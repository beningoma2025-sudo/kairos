import { prisma } from "@kairo/database";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const event = await prisma.liveEvent.findUnique({
    where: { id: params.id },
    include: {
      channel: {
        select: { id: true, name: true, logoUrl: true, slug: true, isVerified: true },
      },
    },
  });

  if (!event) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Never expose stream key to viewers
  const { muxStreamKey: _key, ...safeEvent } = event;

  return Response.json(safeEvent);
}
