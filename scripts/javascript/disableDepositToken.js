const debug = require('debug')('script:disableDepositToken');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async (network, tokenSymbol) => {
  const {
    tokens,
    contracts: { OwnedUpgradeabilityProxy: proxyAddress },
  } = loadNetwork(network);

  const protocol = await Protocol.at(proxyAddress);

  if (!tokens[tokenSymbol].tokenAddress) {
    debug('Invalid token symbol: ', tokenSymbol);
  } else {
    await protocol.disableDepositToken(tokens[tokenSymbol].address);
    debug(`${tokenSymbol} is disabled.`);
  }
});
