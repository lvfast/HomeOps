function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Not Found",
    message: "Route not found",
  });
}

module.exports = notFoundHandler;
