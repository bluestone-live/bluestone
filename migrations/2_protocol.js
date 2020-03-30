const Protocol = artifacts.require('Protocol');
const Configuration = artifacts.require('Configuration');
const LiquidityPools = artifacts.require('LiquidityPools');
const DepositManager = artifacts.require('DepositManager');
const LoanManager = artifacts.require('LoanManager');
const DateTime = artifacts.require('DateTime');
const DaiPriceOracle = artifacts.require('DaiPriceOracle');
const InterestModel = artifacts.require('InterestModel');
const { deploy, toFixedBN } = require('../scripts/utils');

const MedianizerMock = artifacts.require('MedianizerMock');
const OasisDexMock = artifacts.require('OasisDexMock');

module.exports = async function(deployer, network) {
  await deployer.deploy(DateTime);
  await deployer.deploy(Configuration);

  await deployer.link(DateTime, [
    Protocol,
    DepositManager,
    LoanManager,
    LiquidityPools,
    DaiPriceOracle,
  ]);

  await deployer.deploy(LiquidityPools);
  await deployer.link(LiquidityPools, [DepositManager, LoanManager, Protocol]);
  await deployer.deploy(DepositManager);
  await deployer.deploy(LoanManager);
  await deployer.link(Configuration, [Protocol]);
  await deployer.link(DepositManager, [Protocol]);
  await deployer.link(LoanManager, [Protocol]);

  if (network === 'development') {
    await deployLibMocks(deployer);
  }

  await deploy(deployer, network, Protocol);
  await deploy(deployer, network, InterestModel);

  const ethPrice = toFixedBN(200);
  const medianizer = await deployer.deploy(MedianizerMock);
  await medianizer.setPrice(ethPrice);

  const oasisDex = await deployer.deploy(OasisDexMock);
  await oasisDex.setEthPrice(ethPrice);
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
