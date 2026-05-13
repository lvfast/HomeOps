function errorHandler(err, req, res, next) {
  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong",
  });
}

module.exports = errorHandler;
