const { Op } = require("sequelize");
const { User, State } = require("../models");
const bail = require("../micro/bail");
const OAuth = require("../oauth");
const env = require("../env");

// This should be double the frequency of the task.
const refreshIfExpiresInHours = 2;

async function updateMonzoTokens(user) {
  const oauthClient = new OAuth.Monzo({
    client_id: env.MONZO_CLIENT_ID,
    client_secret: env.MONZO_CLIENT_SECRET
  });

  const {
    access_token,
    expires_in,
    refresh_token,
    user_id
  } = await oauthClient.refreshToken(user.monzo_refresh_token);

  const expires = new Date();
  expires.setSeconds(expires.getSeconds() + expires_in);

  const fields = {
    monzo_access_token: access_token,
    monzo_expires: expires,
    monzo_refresh_token: refresh_token
  };

  if (user.id !== user_id) {
    bail("input.id != output.id: Something is seriously wrong!");
  }

  console.log(`Refreshed ${user.id}`);

  return user.update(fields);
}

async function main() {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 9999);

  const usersExpiringSoon = await User.findAll({
    where: { monzo_expires: { [Op.lte]: deadline } }
  });

  console.log(`${usersExpiringSoon.length} Monzo tokens to refresh`);

  usersExpiringSoon.forEach(updateMonzoTokens);
}

main();
