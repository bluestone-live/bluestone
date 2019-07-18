const debug = require('debug')('script:setLoanInterestRate')
const Configuration = artifacts.require('./Configuration.sol')
const { makeTruffleScript, getTokenAddress } = require('./utils.js')

module.exports = makeTruffleScript(async (_, tokenSymbol, loanTerm, decimalValue) => {
  const loanAsset = await getTokenAddress(tokenSymbol)
  const configuration = await Configuration.deployed()
  const scaledValue = web3.utils.toBN(decimalValue * Math.pow(10, 18))

  debug(`Setting loan interest rate of ${tokenSymbol} of term ${loanTerm} to ${decimalValue}...`)
  await configuration.setLoanInterestRate(loanAsset, loanTerm, scaledValue)

  return loanAsset
})
