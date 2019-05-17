const debug = require('debug')('script:setCoefficient')
const Configuration = artifacts.require('./Configuration.sol')
const { makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async(depositTerm, loanTerm, decimalValue) => {
  const configuration = await Configuration.deployed()
  const scaledValue = web3.utils.toBN(decimalValue * Math.pow(10, 18))

  debug(`Setting coefficient a_${depositTerm}_${loanTerm} to ${decimalValue}...`)
  await configuration.setCoefficient(depositTerm, loanTerm, scaledValue)
})
