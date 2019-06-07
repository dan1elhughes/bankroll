const micro = require("micro");
const { router, post, get } = require("microrouter");
const cap = require("./cap");
const env = require("./env");
const database = require("./database");
const { State, User } = require("./models");
const { API, OAuth } = require("./api");
const redirect = require("./micro/redirect");
const query = require("./micro/query");

database.sync();
const oauth = new OAuth(env);

const bail = str => {
  error = new Error(str);
  error.statusCode = 400;
  throw error;
};

module.exports = router(
  post("/webhook", async (req, res) => {
    await cap(client);

    return "OK";
  }),

  get("/oauth/callback", async (req, res) => {
    const { code, state } = query(req);

    if (!code) bail('Missing query parameter "code"');
    if (!state) bail('Missing query parameter "state"');
    if (!(await oauth.validateState(state))) bail("Failed state check");

    const { access_token, refresh_token, user_id } = await oauth.redeemAuthCode(
      code
    );

    const api = new API(access_token, env);

    const { accounts } = await api.accounts({ account_type: "uk_retail" });
    const [mainAccount] = accounts;
    const { id: account_id } = mainAccount;

    const [user, created] = await User.findOrCreate({
      where: { id: user_id },
      defaults: { access_token, refresh_token, account_id }
    });

    await api.createFeedItem({
      account_id,
      type: "basic",
      "params[title]": "Balance manager connected",
      "params[body]": "Authorized successfully",
      "params[image_url]":
        "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/198/white-heavy-check-mark_2705.png"
    });

    return { created };
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
