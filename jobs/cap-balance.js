const { API } = require("../api");
const env = require("../env");

module.exports = async user => {
  const { cap, pot } = user;

  const api = new API(user, env);
  const { balance } = await api.balance();

  console.log({ balance });

  const excess = balance - cap;

  console.log({ excess });

  if (excess <= 0) return;

  console.log("Sweeping...");

  return api.deposit(pot, excess);
};
