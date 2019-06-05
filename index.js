const micro = require("micro");
const { router, post } = require("microrouter");
const cap = require("./cap");
const env = require("./env");
const API = require("./api");
const registerWebhook = require("./registerWebhook");

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

  const { APP_NAME } = env;
  if (!APP_NAME) {
    console.log(`APP_NAME unset, skipping webhook registration`);
    return;
  }

  console.log("Checking webhook registration...");
  try {
    await registerWebhook(client, {
      clean: true,
      url: `https://${APP_NAME}.herokuapp.com/webhook`
    });
  } catch (e) {
    console.error("Unable to register webhook: ", e);
    process.exit(1);
  }
  console.log("Webhook OK");
}, 500);
