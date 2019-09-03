const debug = require('debug')('script:updateDepositMaturity')
const Configuration = artifacts.require("./Configuration.sol");
const DepositManager = artifacts.require("./DepositManager.sol")
const { makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async () => {
  const config = await Configuration.deployed()
  const depositManager = await DepositManager.deployed()

  debug('Lock user actions before update...')
  await config.lockAllUserActions()

  debug('Updating deposit maturity for all assets...')
  await depositManager.updateAllDepositMaturity()

  debug('Unlock user actions after update...')
  await config.unlockAllUserActions()
})
