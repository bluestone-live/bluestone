const Protocol = artifacts.require('Protocol');
const Configuration = artifacts.require('Configuration');
const LiquidityPools = artifacts.require('LiquidityPools');
const DepositManager = artifacts.require('DepositManager');
const LoanManager = artifacts.require('LoanManager');
const AccountManager = artifacts.require('AccountManager');
const DateTime = artifacts.require('DateTime');
const PayableProxy = artifacts.require('PayableProxy');
const { deploy, toFixedBN } = require('../scripts/utils');

// Mocks
const ConfigurationMock = artifacts.require('ConfigurationMock');
const LiquidityPoolsMock = artifacts.require('LiquidityPoolsMock');
const DepositManagerMock = artifacts.require('DepositManagerMock');
const LoanManagerMock = artifacts.require('LoanManagerMock');
const AccountManagerMock = artifacts.require('AccountManagerMock');
const PayableProxyMock = artifacts.require('PayableProxyMock');
const InterestModel = artifacts.require('InterestModel');
const MedianizerMock = artifacts.require('MedianizerMock');
const OasisDexMock = artifacts.require('OasisDexMock');

module.exports = async function(deployer, network) {
  if (network !== 'development') {
    return;
  }
  await deployer.deploy(DateTime);
  await deployer.deploy(Configuration);
  await deployer.deploy(AccountManager);

  await deployer.link(DateTime, [
    Protocol,
    DepositManager,
    LoanManager,
    DepositManagerMock,
    LoanManagerMock,
    LiquidityPools,
    LiquidityPoolsMock,
  ]);

  await deployer.deploy(LiquidityPools);

  await deployer.link(LiquidityPools, [
    DepositManager,
    LoanManager,
    Protocol,
    LiquidityPoolsMock,
    DepositManagerMock,
    LoanManagerMock,
  ]);
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

  const protocolAddress = await deploy(deployer, network, Protocol);
  await deploy(deployer, network, InterestModel);
  await deploy(deployer, network, PayableProxyMock, protocolAddress);

  const ethPrice = toFixedBN(200);
  const medianizer = await deployer.deploy(MedianizerMock);
  await medianizer.setPrice(ethPrice);

  const oasisDex = await deployer.deploy(OasisDexMock);
  await oasisDex.setEthPrice(ethPrice);
};
