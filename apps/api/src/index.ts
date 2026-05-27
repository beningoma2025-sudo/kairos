import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { contentRoutes } from "./routes/content";
import { liveRoutes } from "./routes/live";
import { channelRoutes } from "./routes/channels";
import { progressRoutes } from "./routes/progress";
import { webhookRoutes } from "./routes/webhooks";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error";

const app = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV === "development"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

async function bootstrap() {
  // Security
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001",
    ],
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  // Global auth hook
  app.addHook("preHandler", authMiddleware);

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.0.1",
  }));

  // Routes
  await app.register(contentRoutes, { prefix: "/api/content" });
  await app.register(liveRoutes, { prefix: "/api/live" });
  await app.register(channelRoutes, { prefix: "/api/channels" });
  await app.register(progressRoutes, { prefix: "/api/progress" });
  await app.register(webhookRoutes, { prefix: "/api/webhooks" });

  const port = parseInt(process.env.PORT ?? "4000", 10);
  const host = process.env.HOST ?? "0.0.0.0";

  await app.listen({ port, host });
  app.log.info(`Kairo API running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
