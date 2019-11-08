const debug = require('debug')('script:setProtocolReserveRatio');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadConfig, makeTruffleScript, toFixedBN } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { protocolReserveRatio } = loadConfig(network);
  const protocol = await Protocol.deployed();
  debug(`Set protocol reserve ratio to ${protocolReserveRatio}`);
  await protocol.setProtocolReserveRatio(toFixedBN(protocolReserveRatio));
  debug(`Protocol reserve ratio is set`);
});
