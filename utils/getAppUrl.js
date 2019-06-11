const env = require("../env");

module.exports = () => {
  const { APP_NAME } = env;
  if (APP_NAME === "localhost") {
    return "http://localhost:3000";
  }
  return `https://${APP_NAME}.herokuapp.com`;
};
