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
	const { results } = await truelayerClient.card();
	if (!results.length) bail('Unable to find credit card');
	const cardBalance = results[0].current * 100; // Truelayer returns this as a 2DP float.

	const difference = cardBalance - potBalance;

	if (difference > 0) {
		await monzoClient.deposit(credit_pot, difference);
		return monzoClient.createFeedItem({
			type: 'basic',
			'params[title]': `${amountToString(difference)} saved`,
			'params[body]': `Added to ${credit_pot}`,
			'params[image_url]': 'https://i.imgur.com/tONcN2I.png',
		});
	}

	if (difference < 0) {
		await monzoClient.withdraw(credit_pot, difference);
		return monzoClient.createFeedItem({
			type: 'basic',
			'params[title]': `${amountToString(difference)} added`,
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

async function main() {
	const users = await User.findAll();

	users.forEach(creditBalance);
}

main();
