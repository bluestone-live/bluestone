const debug = require('debug')('script:setupEnvironment')
const TokenFactory = artifacts.require('./TokenFactory.sol') 
const DepositManager = artifacts.require("./DepositManager.sol")
const LoanManager = artifacts.require("./LoanManager.sol")
const Configuration = artifacts.require('./Configuration.sol')
const PriceOracle = artifacts.require('./PriceOracle.sol')
const ERC20Mock = artifacts.require('./ERC20Mock.sol') 
const TokenManager = artifacts.require('./TokenManager.sol')
const { makeTruffleScript } = require('./utils.js')
const { configuration } = require('../../config.js')
const { BN } = web3.utils

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
      await config.setLoanInterestRate(loanAsset, loanTerm, toFixedBN(decimalLoanInterestRate)) 
      debug(`setLoanInterestRate: ${loanTokenSymbol} ${loanTerm} ${decimalLoanInterestRate}`)
    }

    for (let collateralTokenSymbol of tokenSymbolList) {
      const collateralAsset = tokenAddressMap[collateralTokenSymbol]

      if (loanAsset !== collateralAsset) {
        await loanManager.enableLoanAssetPair(loanAsset, collateralAsset)
        debug(`enableLoanAssetPair: ${loanTokenSymbol} ${collateralTokenSymbol}`)
        
        const decimalCollateralRatio = collateralRatio[loanTokenSymbol][collateralTokenSymbol]
        await config.setCollateralRatio(loanAsset, collateralAsset, toFixedBN(decimalCollateralRatio))
        debug(`setCollateralRatio: ${loanTokenSymbol} ${collateralTokenSymbol} ${decimalCollateralRatio}`)

        const decimalLiquidationDiscount = liquidationDiscount[loanTokenSymbol][collateralTokenSymbol]
        await config.setLiquidationDiscount(loanAsset, collateralAsset, toFixedBN(decimalLiquidationDiscount))
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

  // Use fake price here so we know the exact price for later calculation
  const priceList = [ 10, 10, 10 ]
  const scaledPriceList = priceList.map(price => toFixedBN(price))
  const priceOracle = await PriceOracle.deployed()
  const tokenAddressList = tokenSymbolList.map(tokenSymbol => tokenAddressMap[tokenSymbol])

  debug(`setPrices: ${tokenSymbolList} ${priceList}`)
  await priceOracle.setPrices(tokenAddressList, scaledPriceList)

  divider()

  debug(`Initialize deposits for each asset and loans for each asset pair`)
  const tokenManager = await TokenManager.deployed()
  const [ owner, depositor, loaner ] = await web3.eth.getAccounts()
  const initialSupply = toFixedBN(3000)
  const depositAmount = 1000
  const loanAmount = 100
  const collateralAmount = 200
  const freedCollateralAmount = 0
  const terms = [1, 7, 30]

  for (let loanTokenSymbol of tokenSymbolList) {
    divider()

    const loanAsset = await ERC20Mock.at(tokenAddressMap[loanTokenSymbol])
    await loanAsset.mint(depositor, initialSupply)

    await loanAsset.approve(tokenManager.address, initialSupply, { from: depositor })
    debug(`Depositor approves sending ${loanTokenSymbol} to protocol`)

    for (let term of terms) {
      await depositManager.deposit(loanAsset.address, term, toFixedBN(depositAmount), false, { from: depositor })
      debug(`Depositor deposits ${depositAmount} ${loanTokenSymbol} in ${term}-day term`)
    }

    for (let collateralTokenSymbol of tokenSymbolList) {
      if (collateralTokenSymbol !== loanTokenSymbol) {
        const collateralAsset = await ERC20Mock.at(tokenAddressMap[collateralTokenSymbol])
        await collateralAsset.mint(loaner, initialSupply)

        await collateralAsset.approve(tokenManager.address, initialSupply, { from: loaner })
        debug(`Loaner approves sending collateral ${collateralTokenSymbol} to protocol`)

        for (let term of terms) {
          const { logs } = await loanManager.loan(
            term,
            loanAsset.address,
            collateralAsset.address,
            toFixedBN(loanAmount),
            toFixedBN(collateralAmount),
            freedCollateralAmount,
            { from: loaner }
          )
          debug(`Loaner loans ${loanAmount} ${loanTokenSymbol} using ${collateralAmount} ${collateralTokenSymbol} collateral in ${term}-day term`)
        }
      }
    }

    // Now we have initial deposits and loans distributed evenly, we shall set initial coefficients
    setCoefficient(loanTokenSymbol, loanAsset.address, 1, 1, 0.33)
    setCoefficient(loanTokenSymbol, loanAsset.address, 7, 1, 0.33)
    setCoefficient(loanTokenSymbol, loanAsset.address, 30, 1, 0.34)
    setCoefficient(loanTokenSymbol, loanAsset.address, 7, 7, 0.5)
    setCoefficient(loanTokenSymbol, loanAsset.address, 30, 7, 0.5)
    setCoefficient(loanTokenSymbol, loanAsset.address, 30, 30, 1)
  }
})

function divider() {
  debug(`------------------------------------------------------------------`)
}

// TODO: have to duplicate this function as of now since `truffle exec` environment 
// seems to have trouble handling require() statement correctly: 
// https://github.com/trufflesuite/truffle/issues/255
// const { toFixedBN } = require('../../test/utils/index.js')
function toFixedBN(num, significant = 18) {
  let decimalPlaces = (num.toString().split('.')[1] || []).length

  if (decimalPlaces === 0) {
    return new BN(num).mul(new BN(10).pow(new BN(significant)))
  } else {
    const integer = num * Math.pow(10, decimalPlaces)
    return new BN(integer).mul(new BN(10).pow(new BN(significant - decimalPlaces)))
  }
}

function isValidConfiguartion(configuration) {
  if (configuration) {
    const { tokenList, collateralRatio, liquidationDiscount, loanInterestRate } = configuration
    return tokenList && collateralRatio && liquidationDiscount && loanInterestRate
  } else {
    return false
  }
}

async function setCoefficient(tokenSymbol, tokenAddress, depositTerm, loanTerm, decimalValue) {
  debug(`setCoefficient: ${tokenSymbol} ${depositTerm} ${loanTerm} ${decimalValue}`)
  await config.setCoefficient(tokenAddress, depositTerm, loanTerm, toFixedBN(decimalValue))
}
