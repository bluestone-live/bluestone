const debug = require('debug')('script:updateDepositMaturity')
const DepositManager = artifacts.require("./DepositManager.sol")
const { makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async () => {
  const depositManager = await DepositManager.deployed()

  debug('Updating deposit maturity for all assets...')
  await depositManager.updateAllDepositMaturity()
})
