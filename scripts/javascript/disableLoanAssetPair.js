const LoanManager = artifacts.require('./LoanManager.sol')
const TokenFactory = artifacts.require("./TokenFactory.sol")
const { getTokenAddress, makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async (loanTokenSymbol, collateralTokenSymbol) => {
  const tokenFactory = await TokenFactory.deployed()
  const loanManager = await LoanManager.deployed()
  const loanAsset = await getTokenAddress(tokenFactory, loanTokenSymbol)
  const collateralAsset = await getTokenAddress(tokenFactory, collateralTokenSymbol)
  await loanManager.disableLoanAssetPair(loanAsset, collateralAsset)
  return [loanAsset, collateralAsset]
})
