const { API } = require("../api");
const env = require("../env");

module.exports = async user => {
  const { cap, pot } = user;

  const api = user.getMonzoClient();
  const { balance } = await api.balance();

  const excess = balance - cap;
  if (excess <= 0) return 0;
  await api.deposit(pot, excess);
  return excess;
};
