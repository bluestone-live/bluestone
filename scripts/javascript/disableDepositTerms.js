const debug = require('debug')('script:disableDepositTerms');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async (network) => {
  const { contracts } = loadNetwork(network);
  const { depositTerms } = config.get('contract');
  const protocol = await Protocol.at(contracts.Protocol);
  const enabledTerms = (await protocol.getDepositTerms()).map((t) =>
    t.toNumber(),
  );
  const termsToDisable = enabledTerms.filter((t) => !depositTerms.includes(t));

  debug(`Disable deposit terms: ${termsToDisable}`);
  await protocol.disableDepositTerms(termsToDisable);
});
