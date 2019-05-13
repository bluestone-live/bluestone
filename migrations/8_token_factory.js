const TokenFactory = artifacts.require("./TokenFactory.sol");

module.exports = function(deployer, network) {
  if (network == 'development') {
    deployer.deploy(TokenFactory);
  }
};
