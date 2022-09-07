const play = require("~/play")

const options = require("../options")

module.exports = (program) =>
  program
    .command("play")
    .alias("p")
    .description("Play loops")
    .addOption(options.cwd)
    .option("--dry", "run loads and tests but don't run execs")
    .action(async (_opts, command) => {
      const opts = command.optsWithGlobals()
      await play(opts)
    })
