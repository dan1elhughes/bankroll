const fetch = require("node-fetch");

const Base = require("./Base");

const { State } = require("../models");

module.exports = class OAuth extends Base {
  constructor({ CLIENT_ID, CLIENT_SECRET, APP_NAME }) {
    super();
    this.clientId = CLIENT_ID;
    this.clientSecret = CLIENT_SECRET;
    this.appName = APP_NAME;
  }

  getAppURL() {
    const { appName } = this;
    if (appName === "localhost") {
      return "http://localhost:3000";
    }
    return `https://${appName}.herokuapp.com`;
  }

  async getRedirectURL() {
    const { id } = await State.create();

    const redirectUri = this.getAppURL() + "/oauth/callback";

    const queryString = this.toParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      state: id
    }).toString();

    return `https://auth.monzo.com/?${queryString}`;
  }

  async redeemAuthCode(code) {
    const url = `https://api.monzo.com/oauth2/token`;
    const method = "POST";
    const body = this.toParams({
      grant_type: "authorization_code",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.getAppURL() + "/oauth/callback",
      code
    });
    console.log({ url, method, body });
    const res = await fetch(url, { method, body });
    return res.json();
  }

  async validateState(key) {
    const state = await State.findByPk(key);
    if (state && !state.used) {
      await state.destroy();
      return true;
    } else {
      return false;
    }
  }
};
