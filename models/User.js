const Sequelize = require("Sequelize");
const db = require("../database");

class User extends Sequelize.Model {}
User.init(
  {
    id: { type: Sequelize.STRING, primaryKey: true },
    access_token: Sequelize.STRING,
    refresh_token: Sequelize.STRING,
    account_id: Sequelize.STRING
  },
  { sequelize: db, modelName: "user" }
);
module.exports = User;
