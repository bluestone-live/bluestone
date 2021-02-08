const Protocol = artifacts.require('Protocol');
const Configuration = artifacts.require('Configuration');

module.exports = async function (deployer) {
  await deployer.deploy(Configuration);
  await deployer.link(Configuration, [Protocol]);
};
