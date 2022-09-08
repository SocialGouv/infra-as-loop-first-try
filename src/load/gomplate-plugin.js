const main = async (loadPlugin, ...args) => {
  console.log({ loadPlugin, args })
}

main(...process.argv.slice(2))
