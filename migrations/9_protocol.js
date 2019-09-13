const Protocol = artifacts.require("Protocol");
const Configuration = artifacts.require("_Configuration");
const DepositManager = artifacts.require("_DepositManager");
const LoanManager = artifacts.require("_LoanManager");

module.exports = async function(deployer, network) {
  // TODO(desmond): remove it once contract refactor is complete
  if (network !== "development") {
    return;
  }

  const libs = [Configuration, DepositManager, LoanManager];

  for (lib of libs) {
    await deployer.deploy(lib);
    await deployer.link(lib, Protocol);
  }
};
