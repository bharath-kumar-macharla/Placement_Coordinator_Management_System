import rateLimit from "express-rate-limit";

const makeHandler = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max: process.env.NODE_ENV === "production" ? max : 5000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "TOO_MANY_REQUESTS", message } },
    // Skip rate limiting in development or test environment or localhost
    skip: (req) =>
      process.env.NODE_ENV !== "production" ||
      req.ip === "127.0.0.1" ||
      req.ip === "::1" ||
      req.ip === "::ffff:127.0.0.1",
  });

/** General API rate limit: 200 requests per 15 minutes */
export const generalLimiter = makeHandler(
  15 * 60 * 1000,
  200,
  "Too many requests, please try again in 15 minutes."
);

/** Stricter limit on auth routes: 20 per 15 minutes */
export const authLimiter = makeHandler(
  15 * 60 * 1000,
  20,
  "Too many authentication attempts, please try again in 15 minutes."
);

/** AI routes: 30 per minute (Gemini quotas) */
export const aiLimiter = makeHandler(
  60 * 1000,
  30,
  "AI request limit reached. Please wait a moment before trying again."
);
