const Configuration = artifacts.require('Configuration')
const PriceOracle = artifacts.require('PriceOracle')
const TokenManager = artifacts.require('TokenManager')
const LiquidityPools = artifacts.require('LiquidityPools')
const DepositManager = artifacts.require('DepositManagerMock')
const LoanManager = artifacts.require('LoanManagerMock')

const DepositManagerMock = async () => {
  return DepositManager.new(
    (await Configuration.deployed()).address,
    (await PriceOracle.deployed()).address,
    (await TokenManager.deployed()).address,
    (await LiquidityPools.deployed()).address,
  ) 
}

const LoanManagerMock = async () => {
  return LoanManager.new(
    (await Configuration.deployed()).address,
    (await PriceOracle.deployed()).address,
    (await TokenManager.deployed()).address,
    (await LiquidityPools.deployed()).address,
    (await DepositManagerMock()).address
  ) 
}

module.exports = {
  DepositManagerMock,
  LoanManagerMock
}
