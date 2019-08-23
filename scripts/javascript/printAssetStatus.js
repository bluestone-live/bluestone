const debug = require('debug')('script:printAssetStatus')
const Configuration = artifacts.require("./Configuration.sol")
const LiquidityPools = artifacts.require("./LiquidityPools.sol")
const PoolGroup = artifacts.require("./PoolGroup.sol")
const { getTokenAddress, makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async (_, tokenSymbol) => {
  const tokenAddress = await getTokenAddress(tokenSymbol)
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
})
