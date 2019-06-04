const assert = require("assert");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const requiredEnvironmentVariables = [
  "ACCESS_TOKEN",
  "ACCOUNT_ID",
  "CAP",
  "DESTINATION_POT"
];

requiredEnvironmentVariables.forEach(name => {
  assert(process.env[name], `${name} unset`);
  module.exports[name] = process.env[name];
});
