const assert = require('assert');

const requiredEnvironmentVariables = [
	'APP_NAME',
	'DATABASE_URL',
	'MONZO_CLIENT_ID',
	'MONZO_CLIENT_SECRET',
	'NODE_ENV',
	'TRUELAYER_CLIENT_ID',
	'TRUELAYER_CLIENT_SECRET',
];

requiredEnvironmentVariables.forEach(name => {
	assert(process.env[name], `${name} unset`);
	module.exports[name] = process.env[name];
});
