function errorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Invalid JSON request body",
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong",
  });
}

module.exports = errorHandler;
