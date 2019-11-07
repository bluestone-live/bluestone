const debug = require('debug')('script:enableDepositToken');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadConfig, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { depositTerms } = loadConfig(network);
  for (term of depositTerms) {
    const protocol = await Protocol.deployed();
    debug(`Enable deposit term: ${term}`);
    await protocol.enableDepositTerm(term);
  }
});
