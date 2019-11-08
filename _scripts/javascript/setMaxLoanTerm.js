const debug = require('debug')('script:setMaxLoanTerm');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadConfig, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadConfig(network);
  const tokenSymbolList = Object.keys(tokens);
  for (symbol of tokenSymbolList) {
    let token = tokens[symbol];
    if (!token.tokenAddress) {
      return debug(`${symbol} is not deployed yet.`);
    }
    const protocol = await Protocol.deployed();
    await protocol.setMaxLoanTerm(token.tokenAddress, token.maxLoanTerm);
    debug(`Set max loan term: ${symbol} - ${token.maxLoanTerm}`);
  }
});
