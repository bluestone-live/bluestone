const Protocol = artifacts.require('Protocol');
const Configuration = artifacts.require('Configuration');
const LiquidityPools = artifacts.require('LiquidityPools');
const DepositManager = artifacts.require('DepositManager');
const LoanManager = artifacts.require('LoanManager');
const AccountManager = artifacts.require('AccountManager');
const DateTime = artifacts.require('DateTime');
const PayableProxy = artifacts.require('PayableProxy');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const WETH9 = artifacts.require('WETH9');
const { deploy, toFixedBN } = require('../scripts/utils');

module.exports = async function(deployer, network) {
  if (network !== 'rinkeby') {
    return;
  }
  // Deploy WETH
  await deployer.deploy(WETH9);
  const WETH = await WETH9.deployed();

  await deployer.deploy(DateTime);
  await deployer.deploy(Configuration);
  await deployer.deploy(AccountManager);

  await deployer.link(DateTime, [
    Protocol,
    DepositManager,
    LoanManager,
    LiquidityPools,
  ]);

  await deployer.deploy(LiquidityPools);

  await deployer.link(LiquidityPools, [DepositManager, LoanManager, Protocol]);
  await deployer.link(AccountManager, [DepositManager, LoanManager]);
  await deployer.deploy(DepositManager);
  await deployer.deploy(LoanManager);

  await deployer.link(Configuration, [Protocol]);
  await deployer.link(DepositManager, [Protocol]);
  await deployer.link(LoanManager, [Protocol]);
  await deployer.link(AccountManager, [Protocol]);

  const protocolAddress = await deploy(deployer, network, Protocol);
  await deploy(deployer, network, InterestModel);
  await deploy(deployer, network, PayableProxy, protocolAddress, WETH.address);

  const ethPrice = toFixedBN(200);
  const medianizer = await deployer.deploy(MedianizerMock);
  await medianizer.setPrice(ethPrice);

  const oasisDex = await deployer.deploy(OasisDexMock);
  await oasisDex.setEthPrice(ethPrice);
};
