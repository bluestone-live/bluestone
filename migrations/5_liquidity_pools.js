const LiquidityPools = artifacts.require("./LiquidityPools.sol");

module.exports = function(deployer) {
  deployer.deploy(LiquidityPools);
};
