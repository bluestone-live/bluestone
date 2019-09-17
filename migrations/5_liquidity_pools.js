const LiquidityPools = artifacts.require("./LiquidityPools.sol");
const LiquidityPoolsMock = artifacts.require("./LiquidityPoolsMock.sol");
const Configuration = artifacts.require("./Configuration.sol");
const { deploy } = require("../scripts/javascript/utils");

module.exports = async (deployer, network) => {
  await deploy(deployer, network, LiquidityPools, Configuration.address);

  if (network === "development") {
    await deployer.deploy(LiquidityPoolsMock, Configuration.address);
  }
};
