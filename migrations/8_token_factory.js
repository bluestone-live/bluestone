const TokenFactory = artifacts.require("./TokenFactory.sol");

module.exports = function(deployer, network) {
  if (network !== 'live') {
    deployer.deploy(TokenFactory);
  }
};
