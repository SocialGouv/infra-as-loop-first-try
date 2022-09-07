const os = require("os")
const path = require("path")

const defaultsDeep = require("lodash.defaultsdeep")

const ctx = require("~/ctx")
const loadStructuredConfig = require("~/utils/load-structured-config")

const { version } = require(`${__dirname}/../../package.json`)

const loadDependencies = require("./load-dependencies")
const recurseDependency = require("./recurse-dependencies")

module.exports = async (opts = {}, inlineConfigs = [], rootConfig = {}) => {
  const env = ctx.get("env") || process.env

  const rootConfigOverride = {
    infraAsLoopHomeDir: {
      env: "IAL_HOMEDIR",
      defaultFunction: () => {
        const homeOrTmpDir = os.homedir() || os.tmpdir()
        return `${homeOrTmpDir}/.infra-as-loop`
      },
    },
    cwd: {
      env: "IAL_CWD",
      option: "cwd",
      default: process.cwd(),
    },
    cwdSubPath: {
      env: "IAL_CWD_SUBPATH",
      option: "subpath",
      default: ".infra-as-loop",
    },
    cwdIalPath: {
      defaultFunction: (config) => path.join(config.cwd, config.cwdSubPath),
    },
    version: {
      default: version,
    },
  }

  rootConfig = await loadStructuredConfig({
    rootConfig,
    inlineConfigs,
    configOverride: rootConfigOverride,
    options: opts,
    env,
  })

  const configDirs = []
  const { infraAsLoopHomeDir } = rootConfig
  if (infraAsLoopHomeDir) {
    configDirs.push(infraAsLoopHomeDir)
  }
  configDirs.push(rootConfig.cwdIalPath)

  const config = await loadStructuredConfig({
    rootConfig,
    configBasename: "config",
    configDirs,
    options: opts,
    env,
    emptyAsUndefined: true,
  })

  let { dependencies } = config
  if (!dependencies) {
    dependencies = {}
    config.dependencies = dependencies
  }
  dependencies = Object.entries(dependencies)
    .filter(([_key, value]) => value.enabled !== false && value.import)
    .reduce((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, {})

  await loadDependencies(config)

  await recurseDependency({
    config,
    beforeChildren: async ({ definition }) => {
      const { config: extendsConfig } = definition
      if (!extendsConfig) {
        return
      }
      defaultsDeep(config, extendsConfig)
    },
  })

  return config
}
