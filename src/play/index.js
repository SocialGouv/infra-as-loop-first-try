const ctx = require("~/ctx")
const installPackages = require("~/plugins/install-packages")

module.exports = async (_opts) => {
  const config = ctx.require("config")
  await installPackages(config)
  console.log("Hello", { config })
}
