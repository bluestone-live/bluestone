const DepositManager = artifacts.require('./DepositManager.sol')
const { makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async (_, term) => {
  const depositManager = await DepositManager.deployed()
  await depositManager.enableDepositTerm(term)
})
