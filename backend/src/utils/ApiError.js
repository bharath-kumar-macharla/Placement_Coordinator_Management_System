/**
 * Named API error with an HTTP status code and machine-readable code string.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 403, 404, 500)
   * @param {string} message    - Human-readable message returned to the client
   * @param {string} [code]     - Machine-readable error code (defaults to HTTP name)
   */
  constructor(statusCode, message, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code ?? httpCodeName(statusCode);
    this.isOperational = true; // distinguishes expected errors from bugs
  }
}

function httpCodeName(status) {
  const map = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "UNPROCESSABLE_ENTITY",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_SERVER_ERROR",
  };
  return map[status] ?? "ERROR";
}
