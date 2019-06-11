const fetch = require("node-fetch");
const { toQueryParams } = require("../utils");
const { User } = require("../models");

const AUTH_BASE = "https://auth.monzo.com";
const API_BASE = "https://api.monzo.com";

module.exports = class Monzo {
  constructor({ client_id, client_secret }) {
    this.client_id = client_id;
    this.client_secret = client_secret;
  }

  getAuthUrl(redirect_uri, state) {
    const { client_id } = this;

    const queryString = toQueryParams({
      response_type: "code",
      client_id,
      redirect_uri,
      state
    }).toString();

    return `${AUTH_BASE}/?${queryString}`;
  }

  async exchangeCodeForToken(redirect_uri, code) {
    const { client_id, client_secret } = this;
    const method = "POST";
    const url = API_BASE + "/oauth2/token";
    const body = toQueryParams({
      grant_type: "authorization_code",
      client_id,
      client_secret,
      redirect_uri,
      code
    });

    console.log(`\t${method} ${url} ${body || ""}`);
    const res = await fetch(url, { method, body });
    return res.json();
  }

  async refreshToken(refresh_token) {
    const { client_id, client_secret } = this;

    const bodyParams = {
      grant_type: "refresh_token",
      client_id,
      client_secret,
      refresh_token
    };

    const method = "POST";
    const url = API_BASE + "/oauth2/token";
    const body = toQueryParams(bodyParams);

    console.log(`\t${method} ${url} ${body || ""}`);
    const res = await fetch(url, {
      body,
      method
    });
    return res.json();
  }

  async store({ user_id, access_token, expires_in, refresh_token }) {
    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + expires_in);

    const fields = {
      monzo_access_token: access_token,
      monzo_expires: expires,
      monzo_refresh_token: refresh_token
    };

    const existingUser = await User.findOne({ where: { id: user_id } });
    if (existingUser) {
      return existingUser.update(fields);
    } else {
      return User.create({
        id: user_id,
        ...fields
      });
    }
  }
};
