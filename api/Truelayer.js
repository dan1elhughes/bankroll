const { DataAPIClient } = require('truelayer-client');
const OAuth = require('../oauth');
const { User } = require('../models');
const env = require('../env');

module.exports = class API {
	constructor({ access_token, account_id }) {
		this.access_token = access_token;
		this.account_id = account_id;
	}

	async cards() {
		await this.refreshIfNeeded();
		return DataAPIClient.getCards(this.access_token);
	}

	async card() {
		await this.refreshIfNeeded();
		return DataAPIClient.getCardBalance(this.access_token, this.account_id);
	}

	async refreshIfNeeded() {
		try {
			await DataAPIClient.getMe(this.access_token);
		} catch (e) {
			if (e.message !== 'Invalid access token.') throw e;
			console.log('Refreshing Truelayer token...');
			const user = await User.findOne({
				where: { truelayer_access_token: this.access_token },
			});
			const truelayerOAuth = new OAuth.Truelayer({
				client_id: env.TRUELAYER_CLIENT_ID,
				client_secret: env.TRUELAYER_CLIENT_SECRET,
			});
			const response = await truelayerOAuth.refreshToken(
				user.truelayer_refresh_token
			);
			await user.update({
				truelayer_access_token: response.access_token,
				truelayer_refresh_token: response.refresh_token,
			});
			this.access_token = response.access_token;
			console.log('Refreshed Truelayer token');
		}
	}

	// TODO: Auto-refresh if expired.
};
