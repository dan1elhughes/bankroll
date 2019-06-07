const fetch = require("node-fetch");

const Base = require("./Base");

const API_BASE = "https://api.monzo.com";

module.exports = class API extends Base {
  constructor(accessToken, { CLIENT_ID, CLIENT_SECRET }) {
    super();
    this.accessToken = accessToken;
    this.clientId = CLIENT_ID;
    this.clientSecret = CLIENT_SECRET;
  }

  // async deposit(name, amount) {
  //   const { pots } = await this.pots();
  //   const pot = pots.find(pot => pot.name === name);
  //
  //   if (!pot) throw new Error("Pot not found");
  //
  //   const { id } = pot;
  //
  //   const bodyParams = {
  //     amount,
  //     source_account_id: this.accountId,
  //     dedupe_id: new Date().getTime()
  //   };
  //   return this.request("PUT", `/pots/${id}/deposit`, {
  //     bodyParams
  //   });
  // }

  async balance() {
    return this.request("GET", "/balance");
  }

  async webhooks() {
    return this.request("GET", "/webhooks");
  }

  // async registerWebhook(url) {
  //   const bodyParams = {
  //     account_id: this.accountId,
  //     url
  //   };
  //   return this.request("POST", "/webhooks", {
  //     bodyParams
  //   });
  // }

  async exchangeAuthCode() {
    const bodyParams = {
      grant_type: "authorization_code",
      client_id: client_id,
      client_secret: client_secret,
      redirect_uri: redirect_uri,
      code: authorization_code
    };

    return this.request("POST", "/oauth2/token", { bodyParams });
  }

  async accounts(queryParams) {
    return this.request("GET", "/accounts", { queryParams });
  }

  async createFeedItem(bodyParams) {
    return this.request("POST", "/feed", { bodyParams });
  }

  // async deleteWebhook(id) {
  //   return this.request("DELETE", `/webhooks/${id}`);
  // }

  async pots() {
    return this.request("GET", "/pots");
  }

  async request(method, route, { queryParams = {}, bodyParams = {} } = {}) {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`
    };

    const queryParamsResult = this.toParams(queryParams);
    const bodyParamsResult = this.toParams(bodyParams);

    const url = API_BASE + route + "?" + queryParamsResult.toString();
    const body = method === "GET" ? undefined : bodyParamsResult;

    console.log(`\t${method} ${url} ${bodyParamsResult}`);

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
