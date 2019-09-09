const Protocol = artifacts.require("Protocol");
const Configuration = artifacts.require("_Configuration");
const DepositManager = artifacts.require("_DepositManager");

module.exports = async function(deployer, network) {
  // TODO(desmond): remove it once contract refactor is complete
  if (network !== "development") {
    return;
  }

  await deployer.deploy(Configuration);
  await deployer.deploy(DepositManager);

  await deployer.link(Configuration, Protocol);
  await deployer.link(DepositManager, Protocol);
};
