const express = require("express");
const statusRoutes = require("./routes/statusRoutes");

const app = express();

app.use(statusRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "Route not found",
  });
});

module.exports = app;
