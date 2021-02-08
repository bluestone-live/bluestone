const Protocol = artifacts.require('Protocol');
const LoanManager = artifacts.require('LoanManager');

module.exports = async function (deployer) {
  // await deployer.deploy(LoanManager);
  await deployer.link(LoanManager, [Protocol]);
};
