const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    name: "HomeOps API",
    status: "running",
  });
});

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.get("/ready", (req, res) => {
  res.status(200).json({ status: "ready" });
});

module.exports = router;
