const debug = require('debug')('script:enableDepositToken');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async (network, term) => {
  const { depositTerms } = config.get('contract');

  if (depositTerms.indexOf(term) > -1) {
    const protocol = await Protocol.deployed();
    debug(`disable deposit term: ${term}`);
    await protocol.disableDepositTerm(term);
  }
});
