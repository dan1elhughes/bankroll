module.exports = class Base {
  toParams(obj) {
    const result = new URLSearchParams();
    for (const [key, val] of Object.entries(obj)) {
      result.append(key, val);
    }
    return result;
  }
};
