const Core = artifacts.require("./Core.sol");

module.exports = function(deployer) {
  deployer.deploy(Core);
};
