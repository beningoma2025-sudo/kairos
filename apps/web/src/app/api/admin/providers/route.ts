import { prisma } from "@kairo/database";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  slug: z.string().min(1).max(60).toLowerCase().trim()
    .regex(/^[a-z0-9-]+$/, "Slug: lettres minuscules, chiffres et tirets uniquement"),
  type: z.enum(["youtube", "vimeo", "api", "embed", "rss"]),
  logoUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().max(500).optional(),
  baseUrl: z.string().url().optional().or(z.literal("")),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  embedToken: z.string().optional(),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
});

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const providers = await prisma.provider.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { content: true } } },
  });

  return Response.json(
    providers.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      logoUrl: p.logoUrl,
      website: p.website,
      description: p.description,
      isActive: p.isActive,
      isVerified: p.isVerified,
      contentCount: p._count.content,
      createdAt: p.createdAt,
    }))
  );
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch (e) {
    return Response.json({ error: "Invalid request", details: e }, { status: 400 });
  }

  const existing = await prisma.provider.findUnique({ where: { slug: body.slug } });
  if (existing) {
    return Response.json({ error: "Ce slug existe déjà" }, { status: 400 });
  }

  const provider = await prisma.provider.create({
    data: {
      name: body.name,
      slug: body.slug,
      type: body.type,
      logoUrl: body.logoUrl || null,
      website: body.website || null,
      description: body.description || null,
      baseUrl: body.baseUrl || null,
      apiKey: body.apiKey || null,
      apiSecret: body.apiSecret || null,
      embedToken: body.embedToken || null,
      isActive: body.isActive,
      isVerified: body.isVerified,
    },
    select: { id: true, name: true, slug: true, type: true },
  });

  return Response.json(provider, { status: 201 });
}
