const debug = require('debug')('script:setProfitRatio')
const Configuration = artifacts.require('./Configuration.sol')
const { makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async (_, decimalValue) => {
  const configuration = await Configuration.deployed()
  const scaledValue = web3.utils.toBN(decimalValue * Math.pow(10, 18))

  debug(`Setting profit ratio to ${decimalValue}...`)
  await configuration.setProfitRatio(scaledValue)
})
