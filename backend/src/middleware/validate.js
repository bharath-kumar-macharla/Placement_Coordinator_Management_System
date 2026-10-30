import { ApiError } from "../utils/ApiError.js";

/**
 * Validate req.body against a Zod schema.
 * Returns 400 with detailed field errors on failure.
 *
 * @param {import("zod").ZodSchema} schema
 */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(result.error); // ZodError is handled by errorHandler
  }
  req.body = result.data; // replace body with parsed/coerced data
  next();
};
