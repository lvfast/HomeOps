const express = require("express");

const app = express();
const port = process.env.APP_PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`HomeOps API is running on http://localhost:${port}`);
});
