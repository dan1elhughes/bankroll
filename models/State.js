const Sequelize = require("sequelize");
const db = require("../database");
const uuid = require("uuid/v4");

class OAuthState extends Sequelize.Model {}
OAuthState.init(
  {
    id: {
      type: Sequelize.STRING,
      defaultValue: uuid,
      primaryKey: true
    }
  },
  { sequelize: db, modelName: "oauth_state" }
);
module.exports = OAuthState;
