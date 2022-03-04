const debug = require('debug')('script:enableDepositTerms');
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
  const termsToEnable = depositTerms.filter((t) => !enabledTerms.includes(t));
  debug(`Enable deposit terms: ${termsToEnable}`);
  await protocol.enableDepositTerms(termsToEnable);
});
