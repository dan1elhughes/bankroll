const { AuthAPIClient } = require('truelayer-client');
const { User } = require('../models');

const scopes = [
	'info',
	'accounts',
	'balance',
	'transactions',
	'offline_access',
	'cards',
];

module.exports = class Truelayer {
	constructor({ client_id, client_secret }) {
		this.client = new AuthAPIClient({
			client_id,
			client_secret,
		});
	}

	getAuthUrl(redirect_uri, state) {
		const nonce = new Date().getTime();
		const responseMode = undefined; // Default

		return this.client.getAuthUrl(
			redirect_uri,
			scopes,
			nonce,
			responseMode,
			state
		);
	}

	async exchangeCodeForToken(redirect_uri, code) {
		return this.client.exchangeCodeForToken(redirect_uri, code);
	}

	async refreshToken(refresh_token) {
		return this.client.refreshAccessToken(refresh_token);
	}

	async store({ user_id, access_token, refresh_token }) {
		const fields = {
			truelayer_access_token: access_token,
			truelayer_refresh_token: refresh_token,
		};

		const existingUser = await User.findOne({ where: { id: user_id } });

		// Deliberately errors if user doesn't exist.
		return existingUser.update(fields);
	}
};
