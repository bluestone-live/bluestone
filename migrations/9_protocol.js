const Protocol = artifacts.require('Protocol');
const Configuration = artifacts.require('_Configuration');
const LiquidityPools = artifacts.require('_LiquidityPools');
const DepositManager = artifacts.require('_DepositManager');
const LoanManager = artifacts.require('_LoanManager');
const AccountManager = artifacts.require('_AccountManager');
const DateTime = artifacts.require('DateTime');
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
  ]);
  await deployer.link(DateTime, [DepositManager, LoanManager]);
  await deployer.deploy(DepositManager);
  await deployer.deploy(LoanManager);

  await deployer.link(Configuration, [Protocol, ProtocolMock]);
  await deployer.link(DepositManager, [Protocol, ProtocolMock]);
  await deployer.link(LoanManager, [Protocol, ProtocolMock]);
  await deployer.link(AccountManager, [Protocol, ProtocolMock]);
};
