const Protocol = artifacts.require('Protocol');
const Configuration = artifacts.require('Configuration');
const LiquidityPools = artifacts.require('LiquidityPools');
const DepositManager = artifacts.require('DepositManager');
const LoanManager = artifacts.require('LoanManager');
const AccountManager = artifacts.require('AccountManager');
const DateTime = artifacts.require('DateTime');
const ConfigurationMock = artifacts.require('ConfigurationMock');
const LiquidityPoolsMock = artifacts.require('LiquidityPoolsMock');
const DepositManagerMock = artifacts.require('DepositManagerMock');
const LoanManagerMock = artifacts.require('LoanManagerMock');
const AccountManagerMock = artifacts.require('AccountManagerMock');
const InterestModel = artifacts.require('InterestModel');
const PriceOracle = artifacts.require('PriceOracle');
const MedianizerMock = artifacts.require('MedianizerMock');
const OasisDexMock = artifacts.require('OasisDexMock');
const { deploy, toFixedBN } = require('../scripts/utils');

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
  await deployer.link(DateTime, [
    Protocol,
    DepositManager,
    LoanManager,
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

  await deploy(deployer, network, Protocol);
  await deploy(deployer, network, InterestModel);
  await deploy(deployer, network, PriceOracle);

  const ethPrice = toFixedBN(200);
  const medianizer = await deployer.deploy(MedianizerMock);
  await medianizer.setPrice(ethPrice);

  const oasisDex = await deployer.deploy(OasisDexMock);
  await oasisDex.setEthPrice(ethPrice);
};
