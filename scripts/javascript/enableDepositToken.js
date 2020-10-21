const debug = require('debug')('script:enableDepositToken');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const {
    tokens,
    contracts: { OwnedUpgradeabilityProxy: proxyAddress },
  } = loadNetwork(network);

  const protocol = await Protocol.at(proxyAddress);
  const tokenSymbolList = Object.keys(tokens);

  for (symbol of tokenSymbolList) {
    let token = tokens[symbol];
    if (!token.address) {
      debug(`${symbol} is not deployed yet.`);
      return;
    }
    await protocol.enableDepositToken(token.address);
    debug(`${symbol} is enabled.`);
  }
});
