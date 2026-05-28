import { auth } from "@clerk/nextjs/server";
import { prisma, KidsAgeGroup } from "@kairo/database";
import { z } from "zod";

const AGE_GROUP_COLOR: Record<KidsAgeGroup, string> = {
  AGE_2_5: "#4ADE80",
  AGE_6_9: "#60A5FA",
  AGE_10_13: "#C084FC",
};

const AGE_GROUP_DISPLAY: Record<KidsAgeGroup, "2-5" | "6-9" | "10-13"> = {
  AGE_2_5: "2-5",
  AGE_6_9: "6-9",
  AGE_10_13: "10-13",
};

const createSchema = z.object({
  name: z.string().min(1).max(30).trim(),
  ageGroup: z.enum(["AGE_2_5", "AGE_6_9", "AGE_10_13"]),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  dailyLimitMinutes: z.number().int().min(15).max(480).default(60),
});

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return new Response("Not found", { status: 404 });

  const profiles = await prisma.kidsProfile.findMany({
    where: { parentUserId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          watchHistory: { where: { completedAt: { not: null } } },
        },
      },
    },
  });

  return Response.json(
    profiles.map((p) => ({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatarUrl,
      ageGroup: AGE_GROUP_DISPLAY[p.ageGroup],
      color: p.color,
      watchTimeToday: p.watchTimeToday,
      dailyLimitMinutes: p.dailyLimitMinutes,
      completedCount: p._count.watchHistory,
    }))
  );
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return new Response("Not found", { status: 404 });

  const existing = await prisma.kidsProfile.count({ where: { parentUserId: user.id } });
  if (existing >= 5) {
    return new Response("Maximum of 5 profiles reached", { status: 400 });
  }

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  const ageGroup = body.ageGroup as KidsAgeGroup;
  const profile = await prisma.kidsProfile.create({
    data: {
      parentUserId: user.id,
      name: body.name,
      ageGroup,
      color: body.color ?? AGE_GROUP_COLOR[ageGroup],
      dailyLimitMinutes: body.dailyLimitMinutes,
    },
  });

  return Response.json(
    {
      id: profile.id,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      ageGroup: AGE_GROUP_DISPLAY[profile.ageGroup],
      color: profile.color,
      watchTimeToday: profile.watchTimeToday,
      dailyLimitMinutes: profile.dailyLimitMinutes,
      completedCount: 0,
    },
    { status: 201 }
  );
}
