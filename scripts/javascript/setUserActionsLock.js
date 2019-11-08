const debug = require('debug')('script:setUserActionsLock');
const { makeTruffleScript } = require('../utils.js');
const Protocol = artifacts.require('./Protocol.sol');

module.exports = makeTruffleScript(async (_, isLockUserActions) => {
  const protocol = await Protocol.deployed();

  if (isLockUserActions === 'lock') {
    await protocol.lockUserActions();
  } else if (isLockUserActions === 'unlock') {
    await protocol.unlockUserActions();
  } else {
    throw new Error('Invalid user actions lock status, expect lock / unlock');
  }
  debug(`User actions ${isLockUserActions}ed`);
});
