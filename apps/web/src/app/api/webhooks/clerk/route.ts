import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@kairo/database";

interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string;
  };
  type: string;
}

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();

  let event: ClerkUserEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created") {
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id
    );
    if (!primaryEmail) {
      return new Response("No primary email", { status: 400 });
    }

    await prisma.user.create({
      data: {
        clerkId: data.id,
        email: primaryEmail.email_address,
        name: [data.first_name, data.last_name].filter(Boolean).join(" ") || primaryEmail.email_address.split("@")[0]!,
        avatarUrl: data.image_url || null,
        subscription: {
          create: { plan: "FREE", status: "ACTIVE" },
        },
        preferences: {
          create: {},
        },
      },
    });
  }

  if (type === "user.updated") {
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id
    );

    await prisma.user.update({
      where: { clerkId: data.id },
      data: {
        ...(primaryEmail && { email: primaryEmail.email_address }),
        name: [data.first_name, data.last_name].filter(Boolean).join(" ") || undefined,
        avatarUrl: data.image_url || null,
      },
    });
  }

  if (type === "user.deleted") {
    await prisma.user.delete({ where: { clerkId: data.id } });
  }

  return new Response("OK", { status: 200 });
}
