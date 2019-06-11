const assert = require("assert");

const requiredEnvironmentVariables = [
  "APP_NAME",
  "DATABASE_URL",
  "MONZO_CLIENT_ID",
  "MONZO_CLIENT_SECRET",
  "NODE_ENV"
];

requiredEnvironmentVariables.forEach(name => {
  assert(process.env[name], `${name} unset`);
  module.exports[name] = process.env[name];
});
