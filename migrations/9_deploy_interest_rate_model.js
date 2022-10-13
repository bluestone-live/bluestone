const InterestRateModel = artifacts.require('MappingInterestRateModel');
const { deploy, saveNetwork } = require('../scripts/utils');

module.exports = async function (deployer, network) {
  const modelAddress = await deploy(deployer, network, InterestRateModel);
  saveNetwork(network, ['contracts', 'InterestRateModel'], modelAddress);
};
