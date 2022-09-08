const os = require("os")

const fs = require("fs-extra")

const needBin = require("./need-bin")
const downloadFile = require("./download-file")

const gomplateVersion = process.env.GOMPLATE_VERSION || "v3.11.2"

const download = async (options) => {
  const { logger } = options

  let arch = os.arch()
  switch (arch) {
    case "x64":
      arch = "amd64"
      break
    default:
  }
  let platform = os.platform()
  let ext = ""
  switch (platform) {
    case "darwin":
      break
    case "windows":
      ext = ".exe"
      break
    case "linux":
      break
    default:
      platform = "linux"
  }

  const { addPath } = options

  const downloadUrl = `https://github.com/hairyhenderson/gomplate/releases/download/${gomplateVersion}/gomplate_${platform}-${arch}${ext}`
  logger.info(`download ${downloadUrl}`)
  const dest = `${addPath}/gomplate`
  await downloadFile(downloadUrl, dest, logger)
  await fs.chmod(dest, 0o755)
}

module.exports = (options = {}) => needBin("gomplate", download, options)
