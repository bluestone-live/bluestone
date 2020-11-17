const debug = require('debug')('script:disableDepositTerms');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript, loadNetwork } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async (network, ...terms) => {
  const { depositTerms } = config.get('contract');
  const {
    contracts: { OwnedUpgradeabilityProxy: proxyAddress },
  } = loadNetwork(network);

  const protocol = await Protocol.at(proxyAddress);

  debug(`Disable deposit terms: ${terms}`);
  await protocol.disableDepositTerms(terms);
});
