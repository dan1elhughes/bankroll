const env = require('../env');
const OAuth = require('../OAuth');
const { User } = require('../models');
const bail = require('../micro/bail');

async function main([id, token]) {
	const truelayerOAuth = new OAuth.Truelayer({
		client_id: env.TRUELAYER_CLIENT_ID,
		client_secret: env.TRUELAYER_CLIENT_SECRET,
	});

	const { access_token, refresh_token } = await truelayerOAuth.refreshToken(
		token
	);

	const user = await User.findOne({ where: { id } });
	if (!user) bail('User not found');

	const fields = {
		truelayer_access_token: access_token,
		truelayer_refresh_token: refresh_token,
	};

	await user.update(fields);

	const truelayerClient = user.getTruelayerClient();
	const { results } = await truelayerClient.cards();
	const creditCard = results.find(card => card.card_type === 'CREDIT');
	if (!creditCard) bail('Unable to find a credit card');

	const { account_id, display_name } = creditCard;

	await user.update({
		truelayer_account_id: account_id,
	});

	const monzoApi = user.getMonzoClient();
	return monzoApi.createFeedItem({
		type: 'basic',
		'params[title]': 'Bankroll connected to Truelayer',
		'params[body]': display_name,
		'params[image_url]': 'https://i.imgur.com/tONcN2I.png',
	});
}

main(process.argv.slice(2));
