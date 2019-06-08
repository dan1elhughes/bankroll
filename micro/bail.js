module.exports = message => {
  error = new Error(message);
  error.statusCode = 400;
  console.error(message);
  throw error;
};
