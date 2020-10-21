const debug = require('debug')('script:enableDepositToken');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript, loadNetwork } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const {
    contracts: { OwnedUpgradeabilityProxy: proxyAddress },
  } = loadNetwork(network);

  const protocol = await Protocol.at(proxyAddress);

  const { depositTerms } = config.get('contract');
  for (term of depositTerms) {
    debug(`Enable deposit term: ${term}`);
    await protocol.enableDepositTerm(term);
  }
});
