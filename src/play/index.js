const ctx = require("~/ctx")

module.exports = async (_opts) => {
  const config = ctx.require("config")
  console.log("Hello", { config })
}
