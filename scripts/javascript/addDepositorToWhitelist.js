const debug = require('debug')('script:addWhitelisted');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async (network, account) => {
  const { contracts } = loadNetwork(network);
  const protocol = await Protocol.at(contracts.Protocol);
  await protocol.addLenderWhitelisted(account);
});
