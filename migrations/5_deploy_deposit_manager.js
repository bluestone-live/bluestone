const Protocol = artifacts.require('Protocol');
const DepositManager = artifacts.require('DepositManager');

module.exports = async function (deployer) {
  await deployer.deploy(DepositManager);
  await deployer.link(DepositManager, [Protocol]);
};
