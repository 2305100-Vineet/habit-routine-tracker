// Centralized error handler — catches errors passed via next(err) from any route,
// so we don't repeat try/catch + res.status(500) logic in every single route.
function errorHandler(err, req, res, next) {
  console.error(err); // always log the real error server-side for debugging

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Server error'; // hide internal details for unexpected 500s

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;