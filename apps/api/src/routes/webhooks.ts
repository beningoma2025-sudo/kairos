import type { FastifyPluginAsync } from "fastify";
import Stripe from "stripe";
import { prisma } from "@kairo/database";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
});

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/webhooks/stripe
  fastify.post(
    "/stripe",
    {
      config: { rawBody: true },
    },
    async (request, reply) => {
      const sig = request.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !webhookSecret) {
        return reply.code(400).send({ error: "Missing stripe signature" });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          (request as typeof request & { rawBody: Buffer }).rawBody,
          sig,
          webhookSecret
        );
      } catch {
        return reply.code(400).send({ error: "Invalid signature" });
      }

      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdate(sub);
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          await prisma.subscription.update({
            where: { stripeSubscriptionId: sub.id },
            data: { status: "CANCELED", canceledAt: new Date() },
          });
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            await prisma.subscription.update({
              where: { stripeSubscriptionId: invoice.subscription as string },
              data: { status: "PAST_DUE" },
            });
          }
          break;
        }
      }

      return reply.code(200).send({ received: true });
    }
  );
};

async function handleSubscriptionUpdate(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price.id;
  const plan = PRICE_TO_PLAN[priceId ?? ""] ?? "FREE";

  await prisma.subscription.update({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status: sub.status.toUpperCase() as "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | "PAUSED",
      plan: plan as "FREE" | "INDIVIDUAL" | "FAMILY" | "CHURCH" | "CREATOR",
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_INDIVIDUAL ?? ""]: "INDIVIDUAL",
  [process.env.STRIPE_PRICE_FAMILY ?? ""]: "FAMILY",
  [process.env.STRIPE_PRICE_CHURCH ?? ""]: "CHURCH",
};
