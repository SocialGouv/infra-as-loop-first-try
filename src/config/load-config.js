const os = require("os")
const path = require("path")
const { mkdtemp } = require("fs/promises")

const fs = require("fs-extra")
const defaultsDeep = require("lodash.defaultsdeep")
const mergeWith = require("lodash.mergewith")

const ctx = require("~/ctx")
const loadStructuredConfig = require("~/utils/load-structured-config")

const { version } = require(`${__dirname}/../../package.json`)

const loadDependencies = require("./load-dependencies")
const recurseDependency = require("./recurse-dependencies")

const mergeWithKeepPlaybooksRefs = (objValue, ...srcValues) =>
  mergeWith(
    objValue,
    ...srcValues,
    (oValue, srcValue, key, _object, _source, stack) => {
      if (stack.size === 0 && key === "playbooks") {
        if (oValue) {
          Object.assign(srcValue, oValue)
        }
        return srcValue
      }
      if (Array.isArray(oValue)) {
        return srcValue
      }
    }
  )

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
    buildRootPath: {
      env: "IAL_BUILD_ROOT_PATH",
      defaultFunction: () => path.join(os.tmpdir(), "infra-as-loop"),
    },
    buildPath: {
      env: "IAL_BUILD_PATH",
      defaultFunction: async (config) => {
        const { buildRootPath } = config
        await fs.ensureDir(buildRootPath)
        return mkdtemp(path.join(buildRootPath, "build-"))
      },
      transform: async (buildPath) => {
        await fs.ensureDir(buildPath)
        return buildPath
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
    mergeWith: mergeWithKeepPlaybooksRefs,
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
    mergeWith: mergeWithKeepPlaybooksRefs,
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
