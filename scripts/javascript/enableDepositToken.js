const debug = require('debug')('script:enableDepositToken');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async (network, tokenSymbol) => {
  const { tokens } = loadNetwork(network);
  if (!tokens[tokenSymbol] || !tokens[tokenSymbol].address) {
    debug(`token ${tokenSymbol} is not deployed yet.`);
  } else {
    const protocol = await Protocol.deployed();
    await protocol.enableDepositToken(tokens[tokenSymbol].address);
    debug(`${tokenSymbol} is enabled.`);
  }
});
