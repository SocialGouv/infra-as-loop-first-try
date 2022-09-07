const { Option } = require("commander")

module.exports.cwd = new Option("--cwd <path>", "set current working directory")

module.exports.debug = new Option("--debug, -d", "enable debugging loglevel")
