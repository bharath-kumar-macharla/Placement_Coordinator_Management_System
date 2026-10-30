import { ApiError } from "../utils/ApiError.js";

/**
 * Role guard — must be used AFTER `authenticate`.
 *
 * @param {...string} roles - Allowed roles (e.g. "coordinator", "admin")
 */
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, "Not authenticated"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Access denied. Required role: ${roles.join(" or ")}`));
    }
    next();
  };
