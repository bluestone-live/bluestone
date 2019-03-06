const DepositMarket = artifacts.require("./DepositMarket.sol");

module.exports = function(deployer) {
  deployer.deploy(DepositMarket);
};
