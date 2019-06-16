const { DataAPIClient } = require('truelayer-client');
const OAuth = require('../oauth');
const env = require('../env');

module.exports = class API {
	constructor({ access_token, account_id }) {
		this.access_token = access_token;
		this.account_id = account_id;
	}

	async cards() {
		return DataAPIClient.getCards(this.access_token);
	}

	async card() {
		return DataAPIClient.getCardBalance(this.access_token, this.account_id);
	}

	async refreshIfNeeded(refresh_token) {
		try {
			await DataAPIClient.getMe(this.access_token);
		} catch (e) {
			if (e.message !== 'Invalid access token.') throw e;

			console.log('Refreshing Truelayer token...');
			const truelayerOAuth = new OAuth.Truelayer({
				client_id: env.TRUELAYER_CLIENT_ID,
				client_secret: env.TRUELAYER_CLIENT_SECRET,
			});
			const response = await truelayerOAuth.refreshToken(refresh_token);

			this.access_token = response.access_token;
			return response;
		}
	}
};
