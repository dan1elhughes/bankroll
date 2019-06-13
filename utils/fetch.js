const fetch = require('node-fetch');

module.exports = async (...args) => {
	const res = await fetch(...args);

	if (res.ok) return res;
	throw new Error(res.statusText);
};
