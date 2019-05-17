const DepositManager = artifacts.require('./DepositManager.sol')
const TokenFactory = artifacts.require("./TokenFactory.sol")
const { getTokenAddress, makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async tokenSymbol => {
  const tokenFactory = await TokenFactory.deployed()
  const asset = await getTokenAddress(tokenFactory, tokenSymbol)
  const depositManager = await DepositManager.deployed()
  await depositManager.enableDepositAsset(asset)
  return asset
})
