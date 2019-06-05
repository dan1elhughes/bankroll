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

setTimeout(async function() {
  console.log("Testing API connection...");
  try {
    await client.balance();
  } catch (e) {
    console.error("Unable to connect: ", e);
    process.exit(1);
  }
  console.log("API connected");
}, 500);
