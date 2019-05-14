const DepositManagerMock = async () => {
  const DepositManager = artifacts.require('DepositManagerMock')
  const Configuration = artifacts.require('Configuration')
  const PriceOracle = artifacts.require('PriceOracle')
  const TokenManager = artifacts.require('TokenManager')
  const LiquidityPools = artifacts.require('LiquidityPools')

  return await DepositManager.new(
      (await Configuration.deployed()).address,
      (await PriceOracle.deployed()).address,
      (await TokenManager.deployed()).address,
      (await LiquidityPools.deployed()).address,
    ) 
}

module.exports = {
  DepositManagerMock
}
