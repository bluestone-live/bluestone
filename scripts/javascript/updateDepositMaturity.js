const debug = require('debug')('script:updateDepositMaturity');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async _ => {
  const protocol = await Protocol.deployed();

  debug('Lock user actions before update...');
  await protocol.lockUserActions();

  debug('Updating deposit maturity for all assets...');
  await protocol.updateDepositMaturity();

  debug('Unlock user actions after update...');
  await protocol.unlockUserActions();
});
