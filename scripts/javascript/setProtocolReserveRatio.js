const debug = require('debug')('script:setProtocolReserveRatio')
const Configuration = artifacts.require('./Configuration.sol')
const { makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async (_, decimalValue) => {
  const configuration = await Configuration.deployed()
  const scaledValue = web3.utils.toBN(decimalValue * Math.pow(10, 18))

  debug(`Setting protocol reserve ratio to ${decimalValue}...`)
  await configuration.setProtocolReserveRatio(scaledValue)
})
