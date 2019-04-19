const Configuration = artifacts.require("./Configuration.sol");
const PriceOracle = artifacts.require("./PriceOracle.sol");
const TokenManager = artifacts.require("./TokenManager.sol");
const LiquidityPools = artifacts.require("./LiquidityPools.sol");
const LoanManager = artifacts.require("./LoanManager.sol");

module.exports = async function(deployer) {
  await deployer.deploy(
    LoanManager, 
    Configuration.address, 
    PriceOracle.address, 
    TokenManager.address,
    LiquidityPools.address
  );
};
