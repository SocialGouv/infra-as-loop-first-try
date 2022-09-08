const ctx = require("~/ctx")
const installPackages = require("~/plugins/install-packages")

const yaml = require("~/utils/yaml")
const needBin = require("~/bin/need-bin")
const needGomplate = require("~/utils/need-gomplate")

const recursiveRenderTemplatedValues = require("./tpl/resursive-render-templated-values")

module.exports = async (_opts) => {
  const config = ctx.require("config")

  await needBin(needGomplate)

  await installPackages(config)

  const { playbooks } = config
  for (const playbook of playbooks) {
    const { vars } = playbook
    await recursiveRenderTemplatedValues(vars)
  }

  console.log(yaml.dump(config))
}
