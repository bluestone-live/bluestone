const DepositManager = artifacts.require('./DepositManager.sol')
const { getTokenAddress, makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async (_, tokenSymbol) => {
  const asset = await getTokenAddress(tokenSymbol)
  const depositManager = await DepositManager.deployed()
  await depositManager.enableDepositAsset(asset)
  return asset
})
