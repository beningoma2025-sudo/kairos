import { prisma } from "@kairo/database";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["youtube", "vimeo", "api", "embed", "rss"]).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().max(500).optional(),
  baseUrl: z.string().url().optional().or(z.literal("")),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  embedToken: z.string().optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const provider = await prisma.provider.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { content: true } },
      content: {
        where: { status: "PUBLISHED" },
        take: 5,
        select: { id: true, title: true, type: true, thumbnailUrl: true },
      },
    },
  });

  if (!provider) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json(provider);
}

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

  const updated = await prisma.provider.update({
    where: { id: params.id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.type && { type: body.type }),
      ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl || null }),
      ...(body.website !== undefined && { website: body.website || null }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.baseUrl !== undefined && { baseUrl: body.baseUrl || null }),
      ...(body.apiKey !== undefined && { apiKey: body.apiKey || null }),
      ...(body.apiSecret !== undefined && { apiSecret: body.apiSecret || null }),
      ...(body.embedToken !== undefined && { embedToken: body.embedToken || null }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.isVerified !== undefined && { isVerified: body.isVerified }),
    },
    select: { id: true, name: true, slug: true, isActive: true, isVerified: true },
  });

  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  // Dissociate content before deleting provider
  await prisma.content.updateMany({
    where: { providerId: params.id },
    data: { providerId: null },
  });

  await prisma.provider.delete({ where: { id: params.id } });

  return new Response(null, { status: 204 });
}
