const Configuration = artifacts.require('Configuration');
const LiquidityPools = artifacts.require('LiquidityPools');
const DepositManager = artifacts.require('DepositManager');
const LoanManager = artifacts.require('LoanManager');
const DateTime = artifacts.require('DateTime');

module.exports = async function (deployer, network) {
  if (network === 'development') {
    await deployLibMocks(deployer);
  }
};

async function deployLibMocks(deployer) {
  const ConfigurationMock = artifacts.require('ConfigurationMock');
  const LiquidityPoolsMock = artifacts.require('LiquidityPoolsMock');
  const DepositManagerMock = artifacts.require('DepositManagerMock');
  const LoanManagerMock = artifacts.require('LoanManagerMock');

  await deployer.link(DateTime, [
    LiquidityPoolsMock,
    DepositManagerMock,
    LoanManagerMock,
  ]);

  await deployer.link(LiquidityPools, [
    LiquidityPoolsMock,
    DepositManagerMock,
    LoanManagerMock,
  ]);

  await deployer.link(Configuration, [
    ConfigurationMock,
    LoanManagerMock,
    DepositManagerMock,
  ]);

  await deployer.link(DepositManager, [
    ConfigurationMock,
    DepositManagerMock,
    LoanManagerMock,
  ]);

  await deployer.link(LoanManager, [
    ConfigurationMock,
    DepositManagerMock,
    LoanManagerMock,
  ]);
}
