const WETH9 = artifacts.require("./WETH9");

module.exports = function(deployer, network) {
  if (network == "development") {
    deployer.deploy(WETH9);
  }
};
