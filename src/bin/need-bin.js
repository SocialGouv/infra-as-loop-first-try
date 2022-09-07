const ctx = require("~/ctx")

module.exports = async (needFunc) => {
  const config = ctx.require("config")
  const logger = ctx.require("logger")
  await needFunc({
    addPath: `${config.infraAsLoopHomeDir}/bin`,
    cacheDir: `${config.infraAsLoopHomeDir}/cache`,
    logger,
  })
}
