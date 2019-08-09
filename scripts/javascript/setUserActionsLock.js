const debug = require("debug")("script:setUserActionsLock");
const { makeTruffleScript } = require("./utils.js");
const Configuration = artifacts.require("./Configuration.sol");

module.exports = makeTruffleScript(async (_, isLockUserActions) => {
  const configuration = await Configuration.deployed();

  if (isLockUserActions === "1") {
    await configuration.lockAllUserActions();
  } else if (isLockUserActions === "0") {
    await configuration.unlockAllUserActions();
  } else {
    throw new Error(
      "User actions lock status number should be: 0 - unlock, 1 - lock "
    );
  }
});
