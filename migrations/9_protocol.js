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
const AccountManagerMock = artifacts.require('AccountManagerMock');

// TODO(desmond): remove it after we mock every lib
const ProtocolMock = artifacts.require('ProtocolMock');

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
    ProtocolMock,
    LiquidityPoolsMock,
    DepositManagerMock,
  ]);
  await deployer.link(DateTime, [DepositManager, LoanManager]);
  await deployer.deploy(DepositManager);
  await deployer.deploy(LoanManager);

  await deployer.link(Configuration, [
    Protocol,
    ProtocolMock,
    ConfigurationMock,
  ]);
  await deployer.link(DepositManager, [
    Protocol,
    ProtocolMock,
    DepositManagerMock,
  ]);
  await deployer.link(LoanManager, [
    Protocol,
    ProtocolMock,
    DepositManagerMock,
  ]);
  await deployer.link(AccountManager, [
    Protocol,
    ProtocolMock,
    AccountManagerMock,
  ]);
};
