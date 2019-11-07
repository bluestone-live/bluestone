const debug = require('debug')('script:setProtocolAddress');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadConfig, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { protocolAddress } = loadConfig(network);
  const protocol = await Protocol.deployed();
  await protocol.setProtocolAddress(protocolAddress);
  debug(`Set protocol address: ${protocolAddress}`);
});
