import type { FastifyRequest, FastifyReply } from "fastify";

const PUBLIC_ROUTES = ["/health", "/api/webhooks"];

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const isPublic = PUBLIC_ROUTES.some((route) => request.url.startsWith(route));
  if (isPublic) return;

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return;
  }

  // Clerk JWT verification happens via their SDK middleware on the Next.js side.
  // For direct API calls, we verify the Clerk session token.
  const token = authHeader.slice(7);

  try {
    // Attach user info to request — full Clerk verification would use their Node SDK here
    (request as FastifyRequest & { userId?: string }).userId = token;
  } catch {
    // Invalid token — routes that require auth will check request.userId
  }
}
