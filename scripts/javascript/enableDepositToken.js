const debug = require('debug')('script:enableDepositToken');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadNetwork(network);
  const tokenSymbolList = Object.keys(tokens);
  for (symbol of tokenSymbolList) {
    let token = tokens[symbol];
    if (!token.address) {
      debug(`${symbol} is not deployed yet.`);
      return;
    }
    const protocol = await Protocol.deployed();
    await protocol.enableDepositToken(token.address);
    debug(`${symbol} is enabled.`);
  }
});
