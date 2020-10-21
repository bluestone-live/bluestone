const debug = require('debug')('script:enableDepositToken');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript, loadNetwork } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async (network, term) => {
  const { depositTerms } = config.get('contract');
  const {
    contracts: { OwnedUpgradeabilityProxy: proxyAddress },
  } = loadNetwork(network);

  const protocol = await Protocol.at(proxyAddress);

  if (depositTerms.indexOf(term) > -1) {
    debug(`disable deposit term: ${term}`);
    await protocol.disableDepositTerm(term);
  }
});
