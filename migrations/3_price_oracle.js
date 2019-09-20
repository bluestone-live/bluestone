const PriceOracle = artifacts.require('./PriceOracle.sol');
const { deploy } = require('../scripts/javascript/utils');

module.exports = async function(deployer, network) {
  await deploy(deployer, network, PriceOracle);
};
