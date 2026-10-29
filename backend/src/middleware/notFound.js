export function notFound(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
      requestId: req.id,
    },
  });
}

export default notFound;
