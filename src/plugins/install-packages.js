const fs = require("fs-extra")

const recurseDependency = require("~/config/recurse-dependencies")
const yarnInstall = require("~/utils/yarn-install")
const fileHash = require("~/utils/file-hash")

module.exports = async (config) => {
  await recurseDependency({
    config,
    afterChildren: async ({ target }) => {
      if (await fs.pathExists(`${target}/node_modules`)) {
        return
      }

      if (!(await fs.pathExists(`${target}/package.json`))) {
        return
      }

      let hash
      if (!(await fs.pathExists(`${target}/yarn.lock`))) {
        hash = await fileHash(`${target}/yarn.lock`)
      } else {
        hash = await fileHash(`${target}/package.json`)
      }

      const sharedDir = `${config.infraAsLoopHomeDir}/cache/shared-node_modules/${hash}/node_modules`

      await fs.ensureDir(sharedDir)
      fs.symlink(sharedDir, `${target}/node_modules`)

      await yarnInstall(target)
    },
  })
}
