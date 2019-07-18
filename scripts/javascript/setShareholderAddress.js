const debug = require('debug')('script:setShareholderAddress')
const Configuration = artifacts.require('./Configuration.sol')
const { makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async (_, address) => {
  const configuration = await Configuration.deployed()

  debug(`Setting shareholder address to ${address}...`)
  await configuration.setShareholderAddress(address)
})
