import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Central error-handling middleware.
 * Returns { error: { code, message } } — never leaks stack traces in production.
 */
export function errorHandler(err, req, res, _next) {
  // Operational / expected errors
  if (err instanceof ApiError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  // Zod validation errors (from validate middleware)
  if (err.name === "ZodError") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
      },
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token" },
    });
  }

  // Unknown errors — log full detail server-side, return generic message
  logger.error("Unhandled error", {
    message: err.message,
    stack: env.NODE_ENV !== "production" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        env.NODE_ENV === "production"
          ? "An unexpected error occurred. Please try again later."
          : err.message,
    },
  });
}
