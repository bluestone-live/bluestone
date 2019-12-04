const debug = require('debug')('script:setProtocolAddress');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const { protocolAddress } = config.get('contract');
  const protocol = await Protocol.deployed();
  await protocol.setProtocolAddress(protocolAddress);
  debug(`Set protocol address: ${protocolAddress}`);
});
