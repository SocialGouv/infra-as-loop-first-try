const path = require("path")

const InfraAsLoopPluginError = require("~/utils/infra-as-loop-plugin-error.class")
const configDependencyKey = require("./config-dependency-key")
const pluginFunction = require("./function")

function requireTs(filePath) {
  const result = require(filePath)
  return result.default || result
}

module.exports = (type, context) => {
  const { config, getOptions, getScope } = context

  return (inc, parentScope = ["project"]) => {
    const scope = getScope({ scope: parentScope, inc, type })
    const pluginOptions = getOptions({
      scope,
      inc,
      type,
      config,
    })

    const rPath = inc.startsWith("/")
      ? inc
      : path.join(
          config.buildPath,
          ...parentScope.map((s) => `dependencies/${s}`),
          type,
          inc
        )

    const ext = path.extname(inc)

    const pluginName = [
      scope.slice(1),
      type,
      configDependencyKey(path.basename(inc).slice(0, -1 * ext.length)),
    ]
      .flatMap((v) => v)
      .join("/")
    context.logger = context.logger.child({ plugin: pluginName })

    return async (data) => {
      let requireFunc
      if (ext === ".ts") {
        requireFunc = requireTs
      } else {
        requireFunc = (r) => require(r)
      }

      let plugin = requireFunc(rPath)

      if (Array.isArray(plugin)) {
        plugin = pluginFunction(plugin)
      }

      try {
        const result = await plugin(data, pluginOptions, context, scope)
        if (result) {
          data = result
        }
      } catch (error) {
        context.logger.error(
          {
            error: error.toString(),
            ...(error.data || {}),
            ...(error instanceof InfraAsLoopPluginError
              ? {}
              : { errorStack: error.stack }),
          },
          `plugin error`
        )
        throw error
      }

      return data
    }
  }
}
