const debug = require('debug')('script:enableDepositToken');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const { depositTerms } = config.get('contract');
  for (term of depositTerms) {
    const protocol = await Protocol.deployed();
    debug(`Enable deposit term: ${term}`);
    await protocol.enableDepositTerm(term);
  }
});
