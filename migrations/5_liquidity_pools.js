const LiquidityPools = artifacts.require("./LiquidityPools.sol");
const Configuration = artifacts.require("./Configuration.sol");
const { deploy } = require("../scripts/javascript/utils");

module.exports = async function(deployer, network) {
  await deploy(deployer, network, LiquidityPools, Configuration.address);
};
