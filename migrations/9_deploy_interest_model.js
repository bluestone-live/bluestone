const InterestModel = artifacts.require('InterestModel');
const { deploy } = require('../scripts/utils');

module.exports = async function (deployer, network) {
  await deploy(deployer, network, InterestModel);
};
