const debug = require('debug')('script:enableDepositToken');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadConfig, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async (network, term) => {
  const { depositTerms } = loadConfig(network);

  if (depositTerms.indexOf(term) > -1) {
    const protocol = await Protocol.deployed();
    debug(`disable deposit term: ${term}`);
    await protocol.disableDepositTerm(term);
  }
});
