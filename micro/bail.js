module.exports = (message, code = 400) => {
	const error = new Error(message);
	error.statusCode = code;
	console.error(message);
	throw error;
};
