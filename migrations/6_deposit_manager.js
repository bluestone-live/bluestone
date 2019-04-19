const Configuration = artifacts.require("./Configuration.sol");
const PriceOracle = artifacts.require("./PriceOracle.sol");
const TokenManager = artifacts.require("./TokenManager.sol");
const LiquidityPools = artifacts.require("./LiquidityPools.sol");
const DepositManager = artifacts.require("./DepositManager.sol");

module.exports = async function(deployer) {
  await deployer.deploy(
    DepositManager, 
    Configuration.address, 
    PriceOracle.address, 
    TokenManager.address,
    LiquidityPools.address
  );
};
