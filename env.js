const assert = require("assert");

const requiredEnvironmentVariables = [
  "APP_NAME",
  "CLIENT_ID",
  "CLIENT_SECRET",
  "DATABASE_URL",
  "NODE_ENV"
];

requiredEnvironmentVariables.forEach(name => {
  assert(process.env[name], `${name} unset`);
  module.exports[name] = process.env[name];
});
