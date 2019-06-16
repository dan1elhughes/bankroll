const bail = require('../micro/bail');
const { User } = require('../models');

async function creditBalance(user) {
	const { credit_pot } = user;

	const monzoClient = user.getMonzoClient();
	const { pots } = await monzoClient.pots();
	const pot = pots.find(pot => pot.name === credit_pot);
	if (!pot) bail('Unable to find pot');
	const potBalance = pot.balance;

	const truelayerClient = user.getTruelayerClient();

	const newCredentials = await truelayerClient.refreshIfNeeded(
		user.truelayer_refresh_token
	);

	if (
		newCredentials &&
		newCredentials.access_token !== user.truelayer_access_token
	) {
		truelayerClient.access_token = newCredentials.access_token;
		await storeUpdatedTruelayerCredentials({
			id: user.id,
			...newCredentials,
		});
	}

	const { results } = await truelayerClient.card();
	if (!results.length) bail('Unable to find credit card');
	const cardBalance = results[0].current * 100; // Truelayer returns this as a 2DP float.

	const difference = cardBalance - potBalance;
	const amount = Math.abs(difference);

	if (difference > 0) {
		await monzoClient.deposit(credit_pot, amount);
		return monzoClient.createFeedItem({
			type: 'basic',
			'params[title]': `${amountToString(amount)} saved`,
			'params[body]': `Added to ${credit_pot}`,
			'params[image_url]': 'https://i.imgur.com/tONcN2I.png',
		});
	}

	if (difference < 0) {
		await monzoClient.withdraw(credit_pot, amount);
		return monzoClient.createFeedItem({
			type: 'basic',
			'params[title]': `${amountToString(amount)} added`,
			'params[body]': `Added from ${credit_pot}`,
			'params[image_url]': 'https://i.imgur.com/tONcN2I.png',
		});
	}

	console.log(`${credit_pot} balance already matches card balance`);
}

function amountToString(amount) {
	const pounds = amount / 100;
	if (Number.isInteger(pounds)) {
		return `£${pounds}`;
	} else {
		return `£${pounds.toFixed(2)}`;
	}
}

async function storeUpdatedTruelayerCredentials({
	id,
	access_token,
	refresh_token,
}) {
	const user = await User.findOne({
		where: { id },
	});
	await user.update({
		truelayer_access_token: access_token,
		truelayer_refresh_token: refresh_token,
	});

	console.log('Refreshed Truelayer token');
}

async function main() {
	const users = await User.findAll();

	users.forEach(creditBalance);
}

main();
