/**
 * Wraps an async route handler so errors are forwarded to next(err)
 * without try/catch boilerplate in every controller.
 *
 * @param {Function} fn - async (req, res, next) => ...
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
