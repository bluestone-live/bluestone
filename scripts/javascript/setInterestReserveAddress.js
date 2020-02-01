const debug = require('debug')('script:setInterestReserveAddress');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const { interestReserveAddress } = config.get('contract');
  const protocol = await Protocol.deployed();
  await protocol.setInterestReserveAddress(interestReserveAddress);
  debug(`Set interest reserve address: ${interestReserveAddress}`);
});
