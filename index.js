const micro = require("micro");
const { router, post } = require("microrouter");
const cap = require("./cap");
const env = require("./env");
const API = require("./api");

const client = new API(env);

module.exports = router(
  post("/webhook", async (req, res) => {
    await cap(client);

    return "OK";
  })
);
