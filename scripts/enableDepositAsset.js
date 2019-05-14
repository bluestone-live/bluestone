const DepositManager = artifacts.require('./DepositManager.sol')
const TokenFactory = artifacts.require("./TokenFactory.sol")
const { getTokenAddress } = require('./utils.js')

const enableDepositAsset = async asset => {
  const depositManager = await DepositManager.deployed()

  console.log('Enabling deposit asset...')
  await depositManager.enableDepositAsset(asset)
  console.log('Done!')
}

module.exports = async (callback = () => {}, tokenSymbol = process.argv[4]) => {
  if (!tokenSymbol) {
    console.error('You must provide <token-symbol> as argument.')
    return false
  }

  try {
    const tokenFactory = await TokenFactory.deployed()
    const asset = await getTokenAddress(tokenFactory, tokenSymbol)
    await enableDepositAsset(asset)
    callback()
    return asset
  } catch (err) {
    console.error(err)
    callback()
    return false
  }
}
