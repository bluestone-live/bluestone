const InterestRateModel = artifacts.require('MappingInterestRateModel');
const { loadNetwork, deploy, saveNetwork } = require('../scripts/utils');

module.exports = async function (deployer, network) {
  const modelAddress = await deploy(deployer, network, InterestRateModel);

  const { contracts } = loadNetwork(network);
  if (!contracts.InterestRateModel) {
    saveNetwork(network, ['contracts', 'InterestRateModel'], modelAddress);
  }
};
