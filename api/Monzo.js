const fetch = require('../utils/fetch');
const { toQueryParams } = require('../utils');

const API_BASE = 'https://api.monzo.com';

module.exports = class API {
	constructor({ access_token, account_id }) {
		this.access_token = access_token;
		this.account_id = account_id;
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
			dedupe_id: account_id + new Date().getTime(),
		};

		return this.request('PUT', `/pots/${id}/deposit`, {
			bodyParams,
		});
	}

	async withdraw(name, amount) {
		const { pots } = await this.pots();
		const pot = pots.find(pot => pot.name === name);
		if (!pot) throw new Error(`Pot ${name} not found`);

		const { id } = pot;
		const { account_id } = this;

		const bodyParams = {
			amount,
			destination_account_id: account_id,
			dedupe_id: account_id + new Date().getTime(),
		};

		return this.request('PUT', `/pots/${id}/withdraw`, {
			bodyParams,
		});
	}

	async balance() {
		const { account_id } = this;
		const queryParams = { account_id };
		return this.request('GET', '/balance', { queryParams });
	}

	async webhooks() {
		const { account_id } = this;
		const queryParams = { account_id };
		return this.request('GET', '/webhooks', { queryParams });
	}

	async registerWebhook(url) {
		const { account_id } = this;
		const bodyParams = { account_id, url };
		return this.request('POST', '/webhooks', {
			bodyParams,
		});
	}

	async deleteWebhook(id) {
		return this.request('DELETE', `/webhooks/${id}`);
	}

	async accounts(queryParams) {
		return this.request('GET', '/accounts', { queryParams });
	}

	async createFeedItem(params) {
		const { account_id } = this;
		const bodyParams = {
			account_id,
			...params,
		};
		return this.request('POST', '/feed', { bodyParams });
	}

	async pots() {
		const response = await this.request('GET', '/pots');
		return {
			...response,
			pots: (response.pots || []).filter(p => !p.deleted),
		};
	}

	async request(method, route, { queryParams = {}, bodyParams = {} } = {}) {
		const { access_token } = this;
		const headers = { Authorization: `Bearer ${access_token}` };

		const queryParamsResult = toQueryParams(queryParams);
		const bodyParamsResult = toQueryParams(bodyParams);

		const url = API_BASE + route + '?' + queryParamsResult.toString();
		const body = method === 'GET' ? undefined : bodyParamsResult;

		console.log(`\t${method} ${url} ${body || ''}`);

		const res = await fetch(url, {
			method,
			body,
			headers,
		});

		return res.ok ? res.json() : Promise.reject(res);
	}
};
