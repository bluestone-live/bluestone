const LoanManager = artifacts.require('./LoanManager.sol')
const { getTokenAddress, makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async (_, loanTokenSymbol, collateralTokenSymbol) => {
  const loanManager = await LoanManager.deployed()
  const loanAsset = await getTokenAddress(loanTokenSymbol)
  const collateralAsset = await getTokenAddress(collateralTokenSymbol)
  await loanManager.enableLoanAssetPair(loanAsset, collateralAsset)
  return [loanAsset, collateralAsset]
})
