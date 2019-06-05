const API = require("./api");
const assert = require("assert");
const { CAP, DESTINATION_POT } = require("./env");

module.exports = async monzo => {
  // Yes, I'm nesting this entire function in a try/catch.
  try {
    const { balance } = await monzo.balance();

    // API takes amounts in pennies.
    const cap = CAP * 100;

    const excess = balance - cap;

    if (excess <= 0) {
      console.log(`Not sweeping: Excess is not positive (${excess})`);
      return;
    }

    await monzo.deposit(DESTINATION_POT, excess);

    console.log(`Swept ${excess / 100} into ${DESTINATION_POT}`);
  } catch (e) {
    console.error(e);
    return;
  }
};
