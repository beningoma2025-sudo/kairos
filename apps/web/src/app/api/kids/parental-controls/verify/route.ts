import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";
import { z } from "zod";

const bodySchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/),
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, parentalControl: { select: { pin: true } } },
  });
  if (!user) return new Response("Not found", { status: 404 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  // No PIN set yet — any 4-digit PIN is valid (initial setup flow)
  if (!user.parentalControl) {
    return Response.json({ valid: true, isSetup: true });
  }

  if (user.parentalControl.pin !== body.pin) {
    return new Response("Invalid PIN", { status: 403 });
  }

  return Response.json({ valid: true, isSetup: false });
}
