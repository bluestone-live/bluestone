const Configuration = artifacts.require("./Configuration.sol");
const PriceOracle = artifacts.require("./PriceOracle.sol");
const TokenManager = artifacts.require("./TokenManager.sol");
const LiquidityPools = artifacts.require("./LiquidityPools.sol");
const DepositManager = artifacts.require("./DepositManager.sol");
const DepositManagerMock = artifacts.require("./DepositManagerMock.sol");
const Deposit = artifacts.require("./Deposit.sol");
const DateTime = artifacts.require("./DateTime.sol");

module.exports = async function(deployer) {
  await deployer.deploy(DateTime)
  await deployer.link(DateTime, [DepositManager, DepositManagerMock, Deposit])
  await deployer.deploy(
    DepositManager, 
    Configuration.address, 
    PriceOracle.address, 
    TokenManager.address,
    LiquidityPools.address
  );
};
