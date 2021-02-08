const Protocol = artifacts.require('Protocol');
const LiquidityPools = artifacts.require('LiquidityPools');
const DepositManager = artifacts.require('DepositManager');
const LoanManager = artifacts.require('LoanManager');

module.exports = async function (deployer) {
  await deployer.deploy(LiquidityPools);
  await deployer.link(LiquidityPools, [DepositManager, LoanManager, Protocol]);
};
