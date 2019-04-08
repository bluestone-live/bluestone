const { BN } = require('openzeppelin-test-helpers')

const createERC20Token = async (initialHolder, initialSupply = new BN(100)) => {
  const ERC20Mock = artifacts.require('ERC20Mock')
  const token = await ERC20Mock.new(initialHolder, initialSupply)
  return token
}

const printLogs = logs => {
  logs.forEach(({event, args}) => {
    console.log('---')
    console.log(`Event: ${event}`)
    Object.keys(args)
      .filter(key => key !== '0' && key !== '__length__')
      .forEach(key => console.log(`Arg: ${key}, Value: ${args[key]}`))
  })
}

module.exports = {
  createERC20Token,
  printLogs
}
