const Protocol = artifacts.require("Protocol");
const Configuration = artifacts.require("_Configuration");

module.exports = async function(deployer, network) {
  // TODO(desmond): remove it once contract refactor is complete
  if (network !== "development") {
    return;
  }

  await deployer.deploy(Configuration);
  await deployer.link(Configuration, Protocol);
};
