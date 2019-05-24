const debug = require('debug')('script:printAssetStatus')
const Configuration = artifacts.require("./Configuration.sol")
const TokenFactory = artifacts.require("./TokenFactory.sol")
const LiquidityPools = artifacts.require("./LiquidityPools.sol")
const PoolGroup = artifacts.require("./PoolGroup.sol")
const { getTokenAddress, makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async tokenSymbol => {
  const tokenFactory = await TokenFactory.deployed()
  const tokenAddress = await getTokenAddress(tokenFactory, tokenSymbol)
  const config = await Configuration.deployed()
  const liquidityPools = await LiquidityPools.deployed()
  const terms = [1, 7, 30]

  for (let i = 0; i < terms.length; i++) {
    const term = terms[i]

    const loanInterestRate = await config.getLoanInterestRate(tokenAddress, term)
    debug(`Rb${term}: ${loanInterestRate}`) 

    const poolGroupAddress = await liquidityPools.poolGroups(tokenAddress, term)
    const poolGroup = await PoolGroup.at(poolGroupAddress)
    const totalLoanAfterRepay = await poolGroup.getTotalLoanAfterRepay()
    debug(`Mb${term}: ${totalLoanAfterRepay}`)

    const totalLoanableAmount = await poolGroup.totalLoanableAmount()
    debug(`S${term}: ${totalLoanableAmount}`)
  }

  const a_1_1 = await config.getCoefficient(tokenAddress, 1, 1)
  const a_7_1 = await config.getCoefficient(tokenAddress, 7, 1)
  const a_7_7 = await config.getCoefficient(tokenAddress, 7, 7)
  const a_30_1 = await config.getCoefficient(tokenAddress, 30, 1)
  const a_30_7 = await config.getCoefficient(tokenAddress, 30, 7)
  const a_30_30 = await config.getCoefficient(tokenAddress, 30, 30)

  debug(`a_1_1: ${a_1_1}`)
  debug(`a_7_1: ${a_7_1}`)
  debug(`a_7_7: ${a_7_7}`)
  debug(`a_30_1: ${a_30_1}`)
  debug(`a_30_7: ${a_30_7}`)
  debug(`a_30_30: ${a_30_30}`)
})
