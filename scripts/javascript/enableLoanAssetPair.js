const LoanManager = artifacts.require('./LoanManager.sol')
const TokenFactory = artifacts.require("./TokenFactory.sol")
const { getTokenAddress, makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async (loanTokenSymbol, collateralTokenSymbol) => {
  const tokenFactory = await TokenFactory.deployed()
  const loanManager = await LoanManager.deployed()
  const loanAsset = await getTokenAddress(tokenFactory, loanTokenSymbol)
  const collateralAsset = await getTokenAddress(tokenFactory, collateralTokenSymbol)
  await loanManager.enableLoanAssetPair(loanAsset, collateralAsset)
  return [loanAsset, collateralAsset]
})

// module.exports = async (
//   callback = () => {}, 
//   loanTokenSymbol = process.argv[4],
//   collateralTokenSymbol = process.argv[5]
// ) => {
//   if (!loanTokenSymbol || !collateralTokenSymbol) {
//     console.error('You must provide both <loan-token-symbol> and <collateral-token-symbol> as arguments.')
//     return false
//   }

//   try {
//     const tokenFactory = await TokenFactory.deployed()
//     const loanAsset = await getTokenAddress(tokenFactory, loanTokenSymbol)
//     const collateralAsset = await getTokenAddress(tokenFactory, collateralTokenSymbol)
//     await enableLoanAssetPair(loanAsset, collateralAsset)
//     callback()
//     return [loanAsset, collateralAsset]
//   } catch (err) {
//     console.error(err)
//     callback()
//     return false
//   }
// }
