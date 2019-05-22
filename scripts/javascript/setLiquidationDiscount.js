const Configuration = artifacts.require('./Configuration.sol')
const TokenFactory = artifacts.require("./TokenFactory.sol")
const { getTokenAddress, makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async (loanTokenSymbol, collateralTokenSymbol, decimalValue) => {
  const tokenFactory = await TokenFactory.deployed()
  const config = await Configuration.deployed()
  const loanAsset = await getTokenAddress(tokenFactory, loanTokenSymbol)
  const collateralAsset = await getTokenAddress(tokenFactory, collateralTokenSymbol)
  const scaledValue = web3.utils.toBN(decimalValue * Math.pow(10, 18))

  await config.setLiquidationDiscount(loanAsset, collateralAsset, scaledValue)

  return [loanAsset, collateralAsset]
})
