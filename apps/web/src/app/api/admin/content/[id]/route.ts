import { prisma } from "@kairo/database";
import type { ContentStatus } from "@kairo/database";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
  isKids: z.boolean().optional(),
  thumbnailUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  muxPlaybackId: z.string().optional(),
  muxAssetId: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  const updated = await prisma.content.update({
    where: { id: params.id },
    data: {
      ...body,
      ...(body.status && { status: body.status as ContentStatus }),
      ...(body.status === "PUBLISHED" && { publishedAt: new Date() }),
    },
    select: { id: true, title: true, status: true },
  });

  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await prisma.content.delete({ where: { id: params.id } });

  return new Response(null, { status: 204 });
}
