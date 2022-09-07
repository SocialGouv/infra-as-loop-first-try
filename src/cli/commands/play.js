const play = require("~/play")

const options = require("../options")

module.exports = (program) =>
  program
    .command("play")
    .alias("p")
    .description("Play loops")
    .addOption(options.cwd)
    .action(async (_opts, command) => {
      const opts = command.optsWithGlobals()
      await play(opts)
    })
