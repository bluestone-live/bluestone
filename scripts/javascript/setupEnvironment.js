const debug = require('debug')('script:setupEnvironment')
const TokenFactory = artifacts.require('./TokenFactory.sol') 
const DepositManager = artifacts.require("./DepositManager.sol")
const LoanManager = artifacts.require("./LoanManager.sol")
const Configuration = artifacts.require('./Configuration.sol')
const PriceOracle = artifacts.require('./PriceOracle.sol')
const { makeTruffleScript, fetchTokenPrices } = require('./utils.js')
const { configuration } = require('../../config.js')

const scaleToBN = decimal => web3.utils.toBN(decimal * Math.pow(10, 18))

const divider = () => debug(`------------------------------------------------------------------`)

const isValidConfiguartion = configuration => {
  if (configuration) {
    const { tokenList, collateralRatio, liquidationDiscount, loanInterestRate } = configuration
    return tokenList && collateralRatio && liquidationDiscount && loanInterestRate
  } else {
    return false
  }
}

module.exports = makeTruffleScript(async () => {
  if (!isValidConfiguartion(configuration)) {
    throw 'Invalid configuration. Check your ./config.js file.'
  }

  const tokenFactory = await TokenFactory.deployed()
  const depositManager = await DepositManager.deployed()
  const loanManager = await LoanManager.deployed()
  const config = await Configuration.deployed()
  const { tokenList, collateralRatio, liquidationDiscount, loanInterestRate } = configuration

  let tokenAddressMap = {}

  for (let token of tokenList) {
    const { name, symbol } = token 
    const { logs } = await tokenFactory.createToken(name, symbol)
    const address = logs
      .filter(({ event }) => event === 'TokenCreated')[0]
      .args['token']

    debug(`Deployed ${symbol} at ${address}`)
    tokenAddressMap[symbol] = address
  }

  const tokenSymbolList = Object.keys(tokenAddressMap)

  for (let loanTokenSymbol of tokenSymbolList) {
    divider()

    const loanAsset = tokenAddressMap[loanTokenSymbol]
    const loanTerms = [1, 7, 30]

    await depositManager.enableDepositAsset(loanAsset)
    debug(`enableDepositAsset: ${loanTokenSymbol}`)

    for (let loanTerm of loanTerms) {
      const decimalLoanInterestRate = loanInterestRate[loanTokenSymbol][loanTerm]
      await config.setLoanInterestRate(loanAsset, loanTerm, scaleToBN(decimalLoanInterestRate)) 
      debug(`setLoanInterestRate: ${loanTokenSymbol} ${loanTerm} ${decimalLoanInterestRate}`)
    }

    for (let collateralTokenSymbol of tokenSymbolList) {
      const collateralAsset = tokenAddressMap[collateralTokenSymbol]

      if (loanAsset !== collateralAsset) {
        await loanManager.enableLoanAssetPair(loanAsset, collateralAsset)
        debug(`enableLoanAssetPair: ${loanTokenSymbol} ${collateralTokenSymbol}`)
        
        const decimalCollateralRatio = collateralRatio[loanTokenSymbol][collateralTokenSymbol]
        await config.setCollateralRatio(loanAsset, collateralAsset, scaleToBN(decimalCollateralRatio))
        debug(`setCollateralRatio: ${loanTokenSymbol} ${collateralTokenSymbol} ${decimalCollateralRatio}`)

        const decimalLiquidationDiscount = liquidationDiscount[loanTokenSymbol][collateralTokenSymbol]
        await config.setLiquidationDiscount(loanAsset, collateralAsset, scaleToBN(decimalLiquidationDiscount))
        debug(`setLiquidationDiscount: ${loanTokenSymbol} ${collateralTokenSymbol} ${decimalLiquidationDiscount}`)
      }
    }
  }

  divider()

  const account = web3.eth.accounts.create()
  const { address } = account

  debug(`setShareholderAddress: ${address}`)
  await config.setShareholderAddress(address)

  divider()

  const priceList = await fetchTokenPrices(tokenSymbolList, 'USD')
  const scaledPriceList = priceList.map(scaleToBN)
  const priceOracle = await PriceOracle.deployed()
  const tokenAddressList = tokenSymbolList.map(tokenSymbol => tokenAddressMap[tokenSymbol])

  debug('Posting prices to oracle...')
  await priceOracle.setPrices(tokenAddressList, scaledPriceList)
})
