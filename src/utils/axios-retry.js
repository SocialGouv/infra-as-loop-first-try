const axios = require("axios")
const axiosRetry = require("axios-retry")

const version = require("./package-version")

const client = axios.create({
  headers: { "User-Agent": `infra-as-loop v${version}` },
})

axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
})

module.exports = client
