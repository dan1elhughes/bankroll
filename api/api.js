const fetch = require("node-fetch");

const Base = require("./Base");

const API_BASE = "https://api.monzo.com";

module.exports = class API extends Base {
  constructor(user, { CLIENT_ID, CLIENT_SECRET }) {
    super();
    this.user = user;
    this.clientId = CLIENT_ID;
    this.clientSecret = CLIENT_SECRET;
  }

  async deposit(name, amount) {
    const { pots } = await this.pots();
    const pot = pots.find(pot => pot.name === name);
    if (!pot) throw new Error(`Pot ${name} not found`);

    const { id } = pot;
    const { account_id } = this.user;

    const bodyParams = {
      amount,
      source_account_id: account_id,
      dedupe_id: account_id + new Date().getTime()
    };

    return this.request("PUT", `/pots/${id}/deposit`, {
      bodyParams
    });
  }

  async balance() {
    const { account_id } = this.user;
    const queryParams = { account_id };
    return this.request("GET", "/balance", { queryParams });
  }

  async refreshToken(refreshToken) {
    const bodyParams = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    };
    return this.request("POST", "/oauth2/token", { bodyParams });
  }

  async webhooks() {
    const { account_id } = this.user;
    const queryParams = { account_id };
    return this.request("GET", "/webhooks", { queryParams });
  }

  async registerWebhook(url) {
    const { account_id } = this.user;
    const bodyParams = { account_id, url };
    return this.request("POST", "/webhooks", {
      bodyParams
    });
  }

  async deleteWebhook(id) {
    return this.request("DELETE", `/webhooks/${id}`);
  }

  async accounts(queryParams) {
    return this.request("GET", "/accounts", { queryParams });
  }

  async createFeedItem(bodyParams) {
    return this.request("POST", "/feed", { bodyParams });
  }

  async pots() {
    return this.request("GET", "/pots");
  }

  async request(method, route, { queryParams = {}, bodyParams = {} } = {}) {
    const { access_token } = this.user;
    const headers = {
      Authorization: `Bearer ${access_token}`
    };

    const queryParamsResult = this.toParams(queryParams);
    const bodyParamsResult = this.toParams(bodyParams);

    const url = API_BASE + route + "?" + queryParamsResult.toString();
    const body = method === "GET" ? undefined : bodyParamsResult;

    console.log({ url, method, body });

    const res = await fetch(url, {
      method,
      body,
      headers
    });

    if (res.ok) {
      return res.json();
    } else {
      return Promise.reject(res.statusText);
    }
  }
};
