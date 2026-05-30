export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@kairo/database";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return Response.redirect(new URL("/sign-in", req.url));

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { subscription: { select: { stripeCustomerId: true } } },
  });

  const customerId = user?.subscription?.stripeCustomerId;
  if (!customerId) {
    return Response.redirect(new URL("/pricing", req.url));
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin}/account`;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return Response.redirect(session.url);
}
