const express = require("express");
const notFoundHandler = require("./middleware/notFoundHandler");
const statusRoutes = require("./routes/statusRoutes");

const app = express();

app.use(statusRoutes);
app.use(notFoundHandler);

module.exports = app;
