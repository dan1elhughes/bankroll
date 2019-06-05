const fetch = require("node-fetch");
const FormData = require("form-data");
const API_BASE = "https://api.monzo.com";

module.exports = class API {
  constructor({ ACCESS_TOKEN, ACCOUNT_ID }) {
    this.accessToken = ACCESS_TOKEN;
    this.accountId = ACCOUNT_ID;
  }

  get defaultQueryParams() {
    return { account_id: this.accountId };
  }

  async deposit(name, amount) {
    const { pots } = await this.pots();
    const pot = pots.find(pot => pot.name === name);

    if (!pot) throw new Error("Pot not found");

    const { id } = pot;

    const bodyParams = {
      amount,
      source_account_id: this.accountId,
      dedupe_id: new Date().getTime()
    };
    return this.request("PUT", `/pots/${id}/deposit`, {
      bodyParams
    });
  }

  async balance() {
    return this.request("GET", "/balance");
  }

  async webhooks() {
    return this.request("GET", "/webhooks");
  }

  async registerWebhook(url) {
    const bodyParams = {
      account_id: this.accountId,
      url
    };
    return this.request("POST", "/webhooks", {
      bodyParams
    });
  }

  async deleteWebhook(id) {
    return this.request("DELETE", `/webhooks/${id}`);
  }

  async pots() {
    return this.request("GET", "/pots");
  }

  async request(method, route, { queryParams = {}, bodyParams = {} } = {}) {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`
    };

    const queryParamsResult = new URLSearchParams();
    for (const [key, val] of Object.entries({
      ...queryParams,
      ...this.defaultQueryParams
    })) {
      queryParamsResult.append(key, val);
    }

    const bodyParamsResult = new URLSearchParams();
    for (const [key, val] of Object.entries(bodyParams)) {
      bodyParamsResult.append(key, val);
    }

    const url = API_BASE + route + "?" + queryParamsResult.toString();
    const body = method === "GET" ? undefined : bodyParamsResult;

    console.log(`\t${method} ${url}`);

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
