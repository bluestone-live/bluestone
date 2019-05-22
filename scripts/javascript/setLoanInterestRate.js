const debug = require('debug')('script:setLoanInterestRate')
const Configuration = artifacts.require('./Configuration.sol')
const TokenFactory = artifacts.require("./TokenFactory.sol")
const { makeTruffleScript, getTokenAddress } = require('./utils.js')

module.exports = makeTruffleScript(async(tokenSymbol, loanTerm, decimalValue) => {
  const tokenFactory = await TokenFactory.deployed()
  const loanAsset = await getTokenAddress(tokenFactory, tokenSymbol)
  const configuration = await Configuration.deployed()
  const scaledValue = web3.utils.toBN(decimalValue * Math.pow(10, 18))

  debug(`Setting loan interest rate of ${tokenSymbol} of term ${loanTerm} to ${decimalValue}...`)
  await configuration.setLoanInterestRate(loanAsset, loanTerm, scaledValue)

  return loanAsset
})
