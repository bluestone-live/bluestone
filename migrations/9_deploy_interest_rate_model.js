const LinearInterestRateModel = artifacts.require('LinearInterestRateModel');
const MappingInterestRateModel = artifacts.require('MappingInterestRateModel');
const { deploy } = require('../scripts/utils');
const config = require('config');

module.exports = async function (deployer, network) {
  const modelsDeploy = config.get(`contract.interestRateModel.deploy`);
  modelsDeploy.map(async (modelType) => {
    if (modelType === 'Linear') {
      await deploy(deployer, network, LinearInterestRateModel);
    }
    if (modelType === 'Mapping') {
      await deploy(deployer, network, MappingInterestRateModel);
    }
  });
};
