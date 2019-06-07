const { Client } = require("pg");

const { DATABASE_URL } = require("./env");

const Sequelize = require("sequelize");
const db = new Sequelize(DATABASE_URL);

module.exports = db;
