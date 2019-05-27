const debug = require('debug')('script:setShareholderAddressForTest')
const Configuration = artifacts.require('./Configuration.sol')
const { makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async () => {
  const configuration = await Configuration.deployed()
  const account = web3.eth.accounts.create()
  const { address } = account

  debug(`Setting shareholder address to ${address}...`)
  await configuration.setShareholderAddress(address)
})
