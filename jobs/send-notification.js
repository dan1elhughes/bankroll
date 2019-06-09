const { API } = require("../api");
const env = require("../env");

const amountToString = amount => {
  const pounds = amount / 100;
  if (Number.isInteger(pounds)) {
    return `£${pounds}`;
  } else {
    return `£${pounds.toFixed(2)}`;
  }
};

module.exports = async (user, excess) => {
  const { account_id } = user;

  const api = new API(user, env);

  const title = `${amountToString(excess)} saved`;

  return api.createFeedItem({
    account_id,
    type: "basic",
    "params[title]": title,
    "params[body]": "Added to Pot",
    "params[image_url]": "https://i.imgur.com/tONcN2I.png"
  });
};
