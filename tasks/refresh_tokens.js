const { Op } = require("sequelize");
const { User, State } = require("../models");
const bail = require("../micro/bail");
const { API } = require("../api");

// This should be double the frequency of the task.
const refreshIfExpiresInHours = 2;

async function updateTokensFromRefreshToken(user) {
  const api = new API(user, process.env);
  const {
    access_token,
    expires_in,
    refresh_token,
    user_id
  } = await api.refreshToken(user.refresh_token);

  const expires = new Date();
  expires.setSeconds(expires.getSeconds() + expires_in);

  const fields = {
    access_token,
    expires,
    refresh_token
  };

  if (user.id !== user_id) {
    bail("input.id != output.id: Something is seriously wrong!");
  }

  console.log(`Refreshed ${user.id}`);

  return user.update(fields);
}

async function main() {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + refreshIfExpiresInHours);

  const usersExpiringSoon = await User.findAll({
    where: { expires: { [Op.lte]: deadline } }
  });

  console.log(`${usersExpiringSoon.length} tokens to refresh`);

  usersExpiringSoon.forEach(updateTokensFromRefreshToken);
}

main();
