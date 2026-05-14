const express = require("express");
const errorHandler = require("./middleware/errorHandler");
const notFoundHandler = require("./middleware/notFoundHandler");
const statusRoutes = require("./routes/statusRoutes");

const app = express();

app.use(express.json());
app.use(statusRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
