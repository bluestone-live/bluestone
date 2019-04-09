const PriceOracle = artifacts.require("./PriceOracle.sol");

module.exports = function(deployer) {
  deployer.deploy(PriceOracle);
};
