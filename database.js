const { Client } = require("pg");

const { DATABASE_URL, NODE_ENV } = require("./env");

const Sequelize = require("sequelize");
const db = new Sequelize(DATABASE_URL, {
  logging: NODE_ENV === "development" ? console.log : false
});

module.exports = db;
