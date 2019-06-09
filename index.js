// Pre-checked environment variables
const env = require("./env");

// Routing
const micro = require("micro");
const { router, post, get } = require("microrouter");

// Database models
const database = require("./database");
const { State, User } = require("./models");

// Queue and jobs
const Queue = require("better-queue");
const capBalance = require("./jobs/cap-balance");
const sendNotification = require("./jobs/send-notification");

// External API classes
const { API, OAuth } = require("./api");

// HTTP utils
const redirect = require("./micro/redirect");
const query = require("./micro/query");
const bail = require("./micro/bail");

// Helpers (todo)
const registerWebhook = require("./registerWebhook");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Boot setup
database.sync();
const oauth = new OAuth(env);

// Serial queue setup
const capQueue = new Queue(async function(user, done) {
  console.log("Processing queue item...");
  await sleep(1000);

  try {
    const excess = await capBalance(user);
    if (excess > 0) await sendNotification(user, excess);

    done();
  } catch (e) {
    done(e);
  }
});

module.exports = router(
  post("/webhook", async (req, res) => {
    const body = await micro.json(req);
    console.log(`Webhook triggered for transaction: ${body.data.id}`);

    const { account_id } = body.data;
    const user = await User.findOne({ where: { account_id } });
    if (!user) bail(`No user found for account ${account_id}`);

    // This is queued because we receive two webhooks
    // instead of one due to a bug. This queue has a
    // concurrency of one, meaning we finish processing
    // one webhook before starting on the next.
    capQueue.push(user.get({ plain: true }));

    return "ok";
  }),

  get("/oauth/callback", async (req, res) => {
    const { code, state } = query(req);

    if (!code) bail('Missing query parameter "code"');
    if (!state) bail('Missing query parameter "state"');
    if (!(await oauth.validateState(state))) bail("Failed state check");

    const {
      access_token,
      expires_in,
      refresh_token,
      user_id
    } = await oauth.redeemAuthCode(code);

    let api = new API({ access_token }, env);

    const { accounts } = await api.accounts({ account_type: "uk_retail" });
    const [mainAccount] = accounts;
    const { id: account_id } = mainAccount;

    const existingUser = await User.findOne({ where: { id: user_id } });

    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + expires_in);

    const fields = { access_token, account_id, expires, refresh_token };

    if (existingUser) {
      await existingUser.update(fields);
    } else {
      await User.create({
        id: user_id,
        ...fields
      });
    }

    // TODO: This API reassignment once we have more data needs sorting out.
    api = new API(fields, env);

    await registerWebhook(api, {
      clean: true,
      url: oauth.getAppURL() + "/webhook"
    });

    await api.createFeedItem({
      account_id,
      type: "basic",
      "params[title]": "Balance manager connected",
      "params[body]": "Authorized successfully",
      "params[image_url]": "https://i.imgur.com/tONcN2I.png"
    });

    return { connected: true };
  }),

  get("/", async (req, res) => {
    const statusCode = 301;
    const redirectURL = await oauth.getRedirectURL();
    redirect(res, statusCode, redirectURL);
  })
);

(async function() {
  const error = await database.authenticate();
  if (error) {
    console.log(error);
    process.exit(1);
  }
})();
