const Protocol = artifacts.require('Protocol');
const Configuration = artifacts.require('_Configuration');
const LiquidityPools = artifacts.require('_LiquidityPools');
const DepositManager = artifacts.require('_DepositManager');
const LoanManager = artifacts.require('_LoanManager');
const AccountManager = artifacts.require('_AccountManager');
const DateTime = artifacts.require('DateTime');
const ConfigurationMock = artifacts.require('ConfigurationMock');
const LiquidityPoolsMock = artifacts.require('_LiquidityPoolsMock');
const DepositManagerMock = artifacts.require('_DepositManagerMock');
const LoanManagerMock = artifacts.require('_LoanManagerMock');
const AccountManagerMock = artifacts.require('AccountManagerMock');
const { deploy } = require('../_scripts/utils');

module.exports = async function(deployer, network) {
  // TODO(desmond): remove it once contract refactor is complete
  if (network !== 'development') {
    return;
  }

  await deployer.deploy(Configuration);
  await deployer.deploy(LiquidityPools);
  await deployer.deploy(DateTime);
  await deployer.deploy(AccountManager);

  await deployer.link(LiquidityPools, [
    DepositManager,
    LoanManager,
    Protocol,
    LiquidityPoolsMock,
    DepositManagerMock,
    LoanManagerMock,
  ]);
  await deployer.link(DateTime, [DepositManager, LoanManager]);
  await deployer.link(AccountManager, [DepositManager, LoanManager]);
  await deployer.deploy(DepositManager);
  await deployer.deploy(LoanManager);

  await deployer.link(Configuration, [
    Protocol,
    ConfigurationMock,
    LoanManagerMock,
    DepositManagerMock,
  ]);
  await deployer.link(DepositManager, [
    Protocol,
    DepositManagerMock,
    LoanManagerMock,
    ConfigurationMock,
  ]);
  await deployer.link(LoanManager, [
    Protocol,
    DepositManagerMock,
    LoanManagerMock,
    ConfigurationMock,
  ]);
  await deployer.link(AccountManager, [Protocol, AccountManagerMock]);

  await deploy(deployer, network, Protocol);
};
