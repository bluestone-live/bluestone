const debug = require('debug')('script:updateInterestIndexHistories')
const DepositManager = artifacts.require("./DepositManager.sol")
const TokenFactory = artifacts.require("./TokenFactory.sol")
const { makeTruffleScript, getTokenAddress } = require('./utils.js')

module.exports = makeTruffleScript(async () => {
  const tokenFactory = await TokenFactory.deployed()
  const depositManager = await DepositManager.deployed()
  const tokenSymbolList = ['ETH', 'DAI', 'USDT']
  const enabledDepositAssetList = []

  for (let i = 0; i < tokenSymbolList.length; i++) {
    const tokenSymbol = tokenSymbolList[i]
    const tokenAddress = await getTokenAddress(tokenFactory, tokenSymbol) 
    const enabled = await depositManager.isDepositAssetEnabled(tokenAddress)

    if (enabled) {
      enabledDepositAssetList.push(tokenAddress)
    }
  }

  if (enabledDepositAssetList.length === 0) {
    throw 'There is no deposit asset enabled. Make sure at least one asset is enabled.'
  }

  debug('Updating the following enabled deposit assets: %o', enabledDepositAssetList)
  await depositManager.updateAllInterestIndexHistories(enabledDepositAssetList)

  return enabledDepositAssetList
})
