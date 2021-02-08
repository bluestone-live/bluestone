const debug = require('debug')('script:enableDepositToken');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async (network) => {
  const { tokens } = loadNetwork(network);
  const tokenSymbolList = Object.keys(tokens);
  await Promise.all(
    tokenSymbolList.map(async (symbol) => {
      let token = tokens[symbol];
      if (!token.address) {
        debug(`${symbol} is not deployed yet.`);
        return;
      }
      const protocol = await Protocol.deployed();
      await protocol.enableDepositToken(token.address);
      debug(`${symbol} is enabled.`);
    }),
  );
});
