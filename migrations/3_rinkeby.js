const Protocol = artifacts.require('Protocol');
const Configuration = artifacts.require('Configuration');
const LiquidityPools = artifacts.require('LiquidityPools');
const DepositManager = artifacts.require('DepositManager');
const LoanManager = artifacts.require('LoanManager');
const DateTime = artifacts.require('DateTime');
const InterestModel = artifacts.require('InterestModel');
const DaiPriceOracle = artifacts.require('DaiPriceOracle');

const MedianizerMock = artifacts.require('MedianizerMock');
const OasisDexMock = artifacts.require('OasisDexMock');

const { deploy, toFixedBN } = require('../scripts/utils');

module.exports = async function(deployer, network) {
  if (network !== 'rinkeby') {
    return;
  }

  await deployer.deploy(DateTime);
  await deployer.deploy(Configuration);

  await deployer.link(DateTime, [
    Protocol,
    DepositManager,
    LoanManager,
    DaiPriceOracle,
  ]);

  await deployer.deploy(LiquidityPools);

  await deployer.link(LiquidityPools, [DepositManager, LoanManager, Protocol]);
  await deployer.deploy(DepositManager);
  await deployer.deploy(LoanManager);

  await deployer.link(Configuration, [Protocol]);
  await deployer.link(DepositManager, [Protocol]);
  await deployer.link(LoanManager, [Protocol]);

  await deploy(deployer, network, Protocol);
  await deploy(deployer, network, InterestModel);

  const ethPrice = toFixedBN(200);
  const medianizer = await deployer.deploy(MedianizerMock);
  await medianizer.setPrice(ethPrice);

  const oasisDex = await deployer.deploy(OasisDexMock);
  await oasisDex.setEthPrice(ethPrice);
};
