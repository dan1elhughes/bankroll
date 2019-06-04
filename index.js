const API = require("./api");
const assert = require("assert");

const {
  ACCESS_TOKEN,
  ACCOUNT_ID,
  ACCOUNT_NUMBER,
  CAP,
  DESTINATION_POT_ID,
  SORT_CODE
} = process.env;
assert(ACCESS_TOKEN);
assert(ACCOUNT_ID);
assert(ACCOUNT_NUMBER);
assert(CAP);
assert(DESTINATION_POT_ID);
assert(SORT_CODE);

const monzo = new API({
  accessToken: ACCESS_TOKEN,
  accountId: ACCOUNT_ID
});

async function main() {
  const { balance } = await monzo.balance();
  assert(balance);

  // API takes amounts in pennies.
  const cap = CAP * 100;

  const excess = balance - cap;

  if (excess <= 0) {
    console.log(`Not sweeping: Excess is not positive (${excess})`);
    return;
  }

  await monzo.deposit(DESTINATION_POT_ID, excess);
  console.log(`Swept ${excess} into ${DESTINATION_POT_ID}`);
}

main();
