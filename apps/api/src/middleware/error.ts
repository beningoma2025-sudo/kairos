import type { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error({ err: error, url: request.url }, "Request error");

  if (error instanceof ZodError) {
    return reply.code(400).send({
      code: "VALIDATION_ERROR",
      message: "Invalid request data",
      details: error.flatten(),
    });
  }

  if (error.statusCode === 429) {
    return reply.code(429).send({
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later.",
    });
  }

  const statusCode = error.statusCode ?? 500;
  return reply.code(statusCode).send({
    code: error.code ?? "INTERNAL_ERROR",
    message: statusCode >= 500 ? "An internal error occurred" : error.message,
  });
}
