// Pre-checked environment variables
const env = require("./env");

// Routing
const micro = require("micro");
const { router, post, get } = require("microrouter");

// Database models
const database = require("./database");
const { State, User } = require("./models");

// External API classes
const { API, OAuth } = require("./api");

// HTTP utils
const redirect = require("./micro/redirect");
const query = require("./micro/query");
const bail = require("./micro/bail");

// Helpers (todo)
const registerWebhook = require("./registerWebhook");

// Boot setup
database.sync();
const oauth = new OAuth(env);

module.exports = router(
  post("/webhook", async (req, res) => {
    const body = await micro.json(req);
    const { account_id } = body.data;
    console.log(body);
    const user = await User.findOne({ where: { account_id } });
    if (!user) bail(`No user found for account ${account_id}`);

    const api = new API(user, env);

    const { balance } = await api.balance();
    const { cap, pot } = user;

    const excess = balance - cap;
    if (excess <= 0) return "ok";

    await api.deposit(pot, excess);

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
      "params[image_url]":
        "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/198/white-heavy-check-mark_2705.png"
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
