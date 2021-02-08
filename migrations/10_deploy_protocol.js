const Protocol = artifacts.require('Protocol');
const { deploy } = require('../scripts/utils');

module.exports = async function (deployer, network) {
  await deploy(deployer, network, Protocol);
};
