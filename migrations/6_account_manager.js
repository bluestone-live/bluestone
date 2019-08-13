const AccountManager = artifacts.require("./AccountManager.sol");
const TokenManager = artifacts.require("./TokenManager.sol");

module.exports = async function(deployer) {
  await deployer.deploy(AccountManager, TokenManager.address);
};
