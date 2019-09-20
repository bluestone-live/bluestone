const Protocol = artifacts.require('Protocol');
const Configuration = artifacts.require('_Configuration');
const LiquidityPools = artifacts.require('_LiquidityPools');
const DepositManager = artifacts.require('_DepositManager');
const LoanManager = artifacts.require('_LoanManager');
const DateTime = artifacts.require('DateTime');
const ProtocolMock = artifacts.require('ProtocolMock');

module.exports = async function(deployer, network) {
  // TODO(desmond): remove it once contract refactor is complete
  if (network !== 'development') {
    return;
  }

  await deployer.deploy(Configuration);
  await deployer.deploy(LiquidityPools);
  await deployer.deploy(LoanManager);
  await deployer.deploy(DateTime);

  await deployer.link(LiquidityPools, [DepositManager, Protocol, ProtocolMock]);
  await deployer.link(DateTime, DepositManager);
  await deployer.deploy(DepositManager);

  await deployer.link(Configuration, [Protocol, ProtocolMock]);
  await deployer.link(DepositManager, [Protocol, ProtocolMock]);
  await deployer.link(LoanManager, [Protocol, ProtocolMock]);
};
