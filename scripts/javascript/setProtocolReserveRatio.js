const debug = require('debug')('script:setProtocolReserveRatio');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript, toFixedBN } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const { protocolReserveRatio } = config.get('contract');
  const protocol = await Protocol.deployed();
  debug(`Set protocol reserve ratio to ${protocolReserveRatio}`);
  await protocol.setProtocolReserveRatio(toFixedBN(protocolReserveRatio));
  debug(`Protocol reserve ratio is set`);
});
