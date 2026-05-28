import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";

export async function DELETE(
  _req: Request,
  { params }: { params: { contentId: string } }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return new Response("Not found", { status: 404 });

  await prisma.watchlistItem.deleteMany({
    where: { userId: user.id, contentId: params.contentId },
  });

  return new Response(null, { status: 204 });
}

export async function GET(
  _req: Request,
  { params }: { params: { contentId: string } }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.json({ saved: false });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return Response.json({ saved: false });

  const item = await prisma.watchlistItem.findUnique({
    where: { userId_contentId: { userId: user.id, contentId: params.contentId } },
    select: { id: true },
  });

  return Response.json({ saved: !!item });
}
