const micro = require("micro");
const { router, post } = require("microrouter");
const cap = require("./cap");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

module.exports = router(
  post("/webhook", async (req, res) => {
    await cap();

    return "OK";
  })
);
