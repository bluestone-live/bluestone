const debug = require('debug')('script:setMaxLoanTerm');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadNetwork(network);
  const tokenSymbolList = Object.keys(tokens);
  for (symbol of tokenSymbolList) {
    let token = tokens[symbol];
    if (!token.address) {
      return debug(`${symbol} is not deployed yet.`);
    }
    const { maxLoanTerm } = config.get(`contract.tokens.${symbol}`);
    const protocol = await Protocol.deployed();
    await protocol.setMaxLoanTerm(token.address, maxLoanTerm);
    debug(`Set max loan term: ${symbol} - ${maxLoanTerm}`);
  }
});
