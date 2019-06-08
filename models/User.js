const Sequelize = require("Sequelize");
const db = require("../database");

class User extends Sequelize.Model {}
User.init(
  {
    id: { type: Sequelize.STRING, primaryKey: true },
    access_token: Sequelize.STRING,
    account_id: Sequelize.STRING,
    expires: Sequelize.DATE,
    refresh_token: Sequelize.STRING,
    cap: { type: Sequelize.INTEGER, defaultValue: 3000 * 100 },
    pot: { type: Sequelize.STRING, defaultValue: "Sweep test" }
  },
  { sequelize: db, modelName: "user" }
);
module.exports = User;
