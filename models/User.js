const Sequelize = require('sequelize');
const db = require('../database');
const API = require('../api');

class User extends Sequelize.Model {
	getMonzoClient() {
		return new API.Monzo({
			access_token: this.monzo_access_token,
			account_id: this.monzo_account_id,
		});
	}

	getTruelayerClient() {
		return new API.Truelayer({
			access_token: this.truelayer_access_token,
			account_id: this.truelayer_account_id,
		});
	}
}
User.init(
	{
		id: { type: Sequelize.STRING, primaryKey: true },

		monzo_access_token: Sequelize.STRING,
		monzo_account_id: Sequelize.STRING,
		monzo_expires: Sequelize.DATE,
		monzo_refresh_token: Sequelize.STRING,

		truelayer_access_token: Sequelize.STRING(1301),
		truelayer_account_id: Sequelize.STRING,
		truelayer_refresh_token: Sequelize.STRING,

		excess_balance_pot: {
			type: Sequelize.STRING,
			defaultValue: 'Excess balance',
		},
		cap: { type: Sequelize.INTEGER, defaultValue: 3000 * 100 },

		credit_pot: { type: Sequelize.STRING, defaultValue: 'Credit card' },
	},
	{ sequelize: db, modelName: 'user' }
);
module.exports = User;
