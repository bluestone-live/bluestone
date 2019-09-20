const AccountManager = artifacts.require('./AccountManager.sol');
const TokenManager = artifacts.require('./TokenManager.sol');
const { deploy } = require('../scripts/javascript/utils');

module.exports = async function(deployer, network) {
  await deploy(deployer, network, AccountManager, TokenManager.address);
};
