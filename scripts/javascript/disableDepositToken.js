const debug = require('debug')('script:disableDepositToken');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async (network, tokenSymbol) => {
  const { tokens } = loadNetwork(network);
  if (!tokens[tokenSymbol].address) {
    debug('Invalid token symbol: ', tokenSymbol);
  } else {
    const protocol = await Protocol.deployed();
    await protocol.disableDepositToken(tokens[tokenSymbol].address);
    debug(`${tokenSymbol} is disabled.`);
  }
});
