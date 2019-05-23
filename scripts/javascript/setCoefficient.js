const debug = require('debug')('script:setCoefficient')
const Configuration = artifacts.require('./Configuration.sol')
const TokenFactory = artifacts.require("./TokenFactory.sol")
const { makeTruffleScript, getTokenAddress } = require('./utils.js')

module.exports = makeTruffleScript(async(tokenSymbol, depositTerm, loanTerm, decimalValue) => {
  const configuration = await Configuration.deployed()
  const tokenFactory = await TokenFactory.deployed()
  const tokenAddress = await getTokenAddress(tokenFactory, tokenSymbol)
  const scaledValue = web3.utils.toBN(decimalValue * Math.pow(10, 18))

  debug(`Setting coefficient a_${depositTerm}_${loanTerm} to ${decimalValue}...`)
  await configuration.setCoefficient(tokenAddress, depositTerm, loanTerm, scaledValue)

  return tokenAddress
})
