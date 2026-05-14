const app = require("./app");
const { config } = require("./config");

app.listen(config.appPort, () => {
  console.log(`HomeOps API is running on http://localhost:${config.appPort}`);
});
