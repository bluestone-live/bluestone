const DepositManager = artifacts.require("./DepositManager.sol");

module.exports = function(deployer) {
  deployer.deploy(DepositManager);
};
