const { NODE_ENV } = require("../env");

module.exports = class Base {
  toParams(obj) {
    const result = new URLSearchParams();
    for (const [key, val] of Object.entries(obj)) {
      result.append(key, val);
    }
    return result;
  }

  logRequest({ url, method, body }) {
    if (NODE_ENV === "development") {
      console.log(`\t:: ${method} ${url} (${body})`);
    } else {
      console.log(`\t:: ${method} ${url}`);
    }
  }
};
