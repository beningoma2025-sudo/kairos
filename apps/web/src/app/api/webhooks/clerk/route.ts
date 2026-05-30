import { headers } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
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

function verifyClerkWebhook(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  // Reject events older than 5 minutes
  const ts = parseInt(svixTimestamp, 10);
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false;

  // Decode secret (strip "whsec_" prefix, then base64-decode)
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");

  // Compute expected HMAC-SHA256 signature
  const toSign = `${svixId}.${svixTimestamp}.${payload}`;
  const expected = createHmac("sha256", secretBytes)
    .update(toSign, "utf-8")
    .digest("base64");

  // svix-signature is space-separated, each prefixed with "v1,"
  const sigs = svixSignature
    .split(" ")
    .filter((s) => s.startsWith("v1,"))
    .map((s) => s.slice(3));

  return sigs.some((sig) => {
    try {
      return timingSafeEqual(Buffer.from(sig, "base64"), Buffer.from(expected, "base64"));
    } catch {
      return false;
    }
  });
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

  if (!verifyClerkWebhook(payload, svixId, svixTimestamp, svixSignature, webhookSecret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: ClerkUserEvent;
  try {
    event = JSON.parse(payload) as ClerkUserEvent;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { type, data } = event;

  if (type === "user.created") {
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id
    );
    if (!primaryEmail) return new Response("No primary email", { status: 400 });

    const email = primaryEmail.email_address;

    // Owner email is automatically SUPER_ADMIN
    const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "beningoma2025@gmail.com";
    const isOwner = email === OWNER_EMAIL;

    // Also make the very first user SUPER_ADMIN
    const userCount = await prisma.user.count();
    const role = isOwner || userCount === 0 ? "SUPER_ADMIN" : "VIEWER";

    await prisma.user.create({
      data: {
        clerkId: data.id,
        email,
        name:
          [data.first_name, data.last_name].filter(Boolean).join(" ") ||
          email.split("@")[0]!,
        avatarUrl: data.image_url || null,
        role: role as "SUPER_ADMIN" | "VIEWER" | "CHURCH_ADMIN",
        subscription: { create: { plan: "FREE", status: "ACTIVE" } },
        preferences: { create: {} },
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
