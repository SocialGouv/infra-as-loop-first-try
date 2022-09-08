const { mkdtemp } = require("fs/promises")
const path = require("path")

const fs = require("fs-extra")

const ctx = require("~/ctx")
const asyncShell = require("~/utils/async-shell")

const loadPluginCmd = path.resolve(
  `${__dirname}/../../../bin/gomplate-plugin-load`
)

const gomplateWithLoadPlugin = async (tpl, context) => {
  const config = ctx.require("config")
  const tplBuildPath = await mkdtemp(`${config.buildPath}/tpl-`)
  await fs.writeFile(`${tplBuildPath}/context.json`, JSON.stringify(context))
  await fs.writeFile(`${tplBuildPath}/config.json`, JSON.stringify(config))
  const gomplateCmd = `
    gomplate
      --plugin load=${loadPluginCmd}
      --datasource context.json
      --datasource config.json
  `
  const result = await asyncShell(
    gomplateCmd,
    { cwd: tplBuildPath },
    (proc) => {
      proc.stdin.write(tpl)
      proc.stdin.end()
    }
  )
  console.log({ tpl, result })
  return result
}

const recursiveRenderTemplatedValues = async (vars, context) => {
  if (Array.isArray(vars)) {
    const newArr = []
    let key = 0
    for (const value of vars) {
      newArr.push(
        await recursiveRenderTemplatedValues(value, { parent: vars, key })
      )
      key++
    }
    return newArr
  }
  if (typeof vars === "object" && vars !== null) {
    for (const [key, value] of Object.entries(vars)) {
      vars[key] = await recursiveRenderTemplatedValues(value, {
        parent: vars,
        key,
      })
    }
  }
  if (typeof vars === "string") {
    await gomplateWithLoadPlugin(vars, context)
  }
  return vars
  //
  /*
  write config to random/configFile
  write context of var to random/contextFile
  gomplateWithLoadPlugin(, {configFile, contextFile})
  */
}

module.exports = async (vars) => {
  await recursiveRenderTemplatedValues(vars)
}
