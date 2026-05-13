const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.status(200).json({
    name: "HomeOps API",
    status: "running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "Route not found",
  });
});

module.exports = app;
