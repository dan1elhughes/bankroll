const { Op } = require("sequelize");
const { State } = require("../models");
const bail = require("../micro/bail");

const deleteOlderThanHours = 48;

async function main() {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() - deleteOlderThanHours);

  const authsToDelete = await State.findAll({
    where: { createdAt: { [Op.lte]: deadline } }
  });

  if (authsToDelete.length > 0) {
    console.log(`Deleting ${authsToDelete.length} unused auths`);
    authsToDelete.forEach(auth => auth.destroy());
  } else {
    console.log("No unused auths to delete");
  }
}

main();
