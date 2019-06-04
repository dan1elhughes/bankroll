const fetch = require("node-fetch");
const FormData = require("form-data");
const API_BASE = "https://api.monzo.com";

module.exports = class API {
  constructor({ accessToken, accountId }) {
    this.accessToken = accessToken;
    this.accountId = accountId;
  }

  get defaultQueryParams() {
    return { account_id: this.accountId };
  }

  async deposit(pot, amount) {
    const bodyParams = {
      amount,
      source_account_id: this.accountId,
      dedupe_id: new Date().getTime()
    };
    return this.request("PUT", `/pots/${pot}/deposit`, {
      bodyParams
    });
  }

  async balance() {
    return this.request("GET", "/balance");
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

    console.log(`${method} ${url}`);

    const res = await fetch(url, {
      method,
      body,
      headers
    });

    return res.json();
  }
};
