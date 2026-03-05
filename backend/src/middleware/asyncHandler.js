/**
 * Wraps async route handlers to forward rejected promises to centralized error handler.
 * Use: router.get('/path', asyncHandler(controller.method))
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
