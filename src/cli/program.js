const { Command } = require("commander")

const loadConfig = require("~/config/load-config")
const ctx = require("~/ctx")
const createLogger = require("~/utils/logger-factory")
const globalLogger = require("~/utils/logger")

const options = require("./options")

module.exports = () => {
  const program = new Command()

  program
    .name("infra-as-loop")
    .description("Infra as Code on idempotency pipelines framework ☀️")
    .version(require(`${__dirname}/../../package.json`).version)
    .addOption(options.debug)
    .hook("preAction", async (_thisCommand, actionCommand) => {
      const opts = actionCommand.optsWithGlobals()

      const config = await loadConfig(opts)
      ctx.set("config", config)

      const logger = createLogger({
        sync: false,
        secrets: [],
      })
      ctx.set("logger", logger)
      logger.configureDebug(opts.D)
      globalLogger.configureDebug(opts.D)
    })

  return program
}
