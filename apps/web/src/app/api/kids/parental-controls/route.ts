import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";
import { z } from "zod";

const updateSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/),
  newPin: z.string().length(4).regex(/^\d{4}$/).optional(),
  enabled: z.boolean().optional(),
  maxAgeRating: z.enum(["G", "PG", "TV_Y", "TV_Y7", "TV_G", "TV_PG"]).optional(),
  kidsMode: z.boolean().optional(),
  watchTimeLimit: z.number().int().min(15).max(480).nullable().optional(),
});

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      parentalControl: {
        select: {
          enabled: true,
          maxAgeRating: true,
          kidsMode: true,
          watchTimeLimit: true,
        },
      },
    },
  });
  if (!user) return new Response("Not found", { status: 404 });

  return Response.json({
    hasPin: !!user.parentalControl,
    enabled: user.parentalControl?.enabled ?? false,
    maxAgeRating: user.parentalControl?.maxAgeRating ?? "PG",
    kidsMode: user.parentalControl?.kidsMode ?? false,
    watchTimeLimit: user.parentalControl?.watchTimeLimit ?? null,
  });
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, parentalControl: { select: { pin: true } } },
  });
  if (!user) return new Response("Not found", { status: 404 });

  let body: z.infer<typeof updateSchema>;
  try {
    body = updateSchema.parse(await req.json());
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  if (user.parentalControl && user.parentalControl.pin !== body.pin) {
    return new Response("Invalid PIN", { status: 403 });
  }

  const updated = await prisma.parentalControl.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      pin: body.newPin ?? body.pin,
      enabled: body.enabled ?? true,
      maxAgeRating: body.maxAgeRating ?? "PG",
      kidsMode: body.kidsMode ?? false,
      watchTimeLimit: body.watchTimeLimit ?? null,
    },
    update: {
      ...(body.newPin !== undefined && { pin: body.newPin }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.maxAgeRating !== undefined && { maxAgeRating: body.maxAgeRating }),
      ...(body.kidsMode !== undefined && { kidsMode: body.kidsMode }),
      ...(body.watchTimeLimit !== undefined && { watchTimeLimit: body.watchTimeLimit }),
    },
    select: {
      enabled: true,
      maxAgeRating: true,
      kidsMode: true,
      watchTimeLimit: true,
    },
  });

  return Response.json({ hasPin: true, ...updated });
}
