const LiquidityPools = artifacts.require("./LiquidityPools.sol");
const Configuration = artifacts.require("./Configuration.sol");

module.exports = function(deployer) {
  deployer.deploy(
    LiquidityPools,
    Configuration.address
  );
};
