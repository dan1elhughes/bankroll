const assert = require("assert");
const fetch = require("node-fetch");
const { toQueryParams } = require("../utils");

const API_BASE = "https://api.monzo.com";

module.exports = class API {
  constructor({ access_token }) {
    this.access_token = access_token;
  }

  async withAccountId() {
    const { accounts } = await this.accounts({
      account_type: "uk_retail"
    });
    const [mainAccount] = accounts;
    this.account_id = mainAccount.id;
    return this;
  }

  async deposit(name, amount) {
    const { pots } = await this.pots();
    const pot = pots.find(pot => pot.name === name);
    if (!pot) throw new Error(`Pot ${name} not found`);

    const { id } = pot;
    const { account_id } = this;

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
    const { account_id } = this;
    const queryParams = { account_id };
    return this.request("GET", "/balance", { queryParams });
  }

  async webhooks() {
    const { account_id } = this;
    const queryParams = { account_id };
    return this.request("GET", "/webhooks", { queryParams });
  }

  async registerWebhook(url) {
    const { account_id } = this;
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

  async createFeedItem(params) {
    const { account_id } = this;
    const bodyParams = {
      account_id,
      ...params
    };
    return this.request("POST", "/feed", { bodyParams });
  }

  async pots() {
    return this.request("GET", "/pots");
  }

  async request(method, route, { queryParams = {}, bodyParams = {} } = {}) {
    const { access_token } = this;
    const headers = { Authorization: `Bearer ${access_token}` };

    const queryParamsResult = toQueryParams(queryParams);
    const bodyParamsResult = toQueryParams(bodyParams);

    const url = API_BASE + route + "?" + queryParamsResult.toString();
    const body = method === "GET" ? undefined : bodyParamsResult;

    console.log(`\t${method} ${url} ${body || ""}`);

    const res = await fetch(url, {
      method,
      body,
      headers
    });

    if (res.ok) {
      return res.json();
    } else {
      return Promise.reject(res);
    }
  }
};
