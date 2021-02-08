const Protocol = artifacts.require('Protocol');
const LiquidityPools = artifacts.require('LiquidityPools');
const DepositManager = artifacts.require('DepositManager');
const LoanManager = artifacts.require('LoanManager');
const DateTime = artifacts.require('DateTime');
const DaiPriceOracle = artifacts.require('DaiPriceOracle');

module.exports = async function (deployer) {
  await deployer.deploy(DateTime);
  await deployer.link(DateTime, [
    Protocol,
    DepositManager,
    LoanManager,
    LiquidityPools,
    DaiPriceOracle,
  ]);
};
