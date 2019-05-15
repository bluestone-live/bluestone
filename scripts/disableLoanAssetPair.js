const LoanManager = artifacts.require('./LoanManager.sol')
const TokenFactory = artifacts.require("./TokenFactory.sol")
const { getTokenAddress } = require('./utils.js')

const disableLoanAssetPair = async (loanAsset, collateralAsset) => {
  const loanManager = await LoanManager.deployed()

  console.log('Disabling loan asset pair...')
  await loanManager.disableLoanAssetPair(loanAsset, collateralAsset)
  console.log('Done!')
}

module.exports = async (
  callback = () => {}, 
  loanTokenSymbol = process.argv[4],
  collateralTokenSymbol = process.argv[5]
) => {
  if (!loanTokenSymbol || !collateralTokenSymbol) {
    console.error('You must provide both <loan-token-symbol> and <collateral-token-symbol> as arguments.')
    return false
  }

  try {
    const tokenFactory = await TokenFactory.deployed()
    const loanAsset = await getTokenAddress(tokenFactory, loanTokenSymbol)
    const collateralAsset = await getTokenAddress(tokenFactory, collateralTokenSymbol)
    await disableLoanAssetPair(loanAsset, collateralAsset)
    callback()
    return [loanAsset, collateralAsset]
  } catch (err) {
    console.error(err)
    callback()
    return false
  }
}
