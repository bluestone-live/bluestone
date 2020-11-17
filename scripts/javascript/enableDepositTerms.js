const debug = require('debug')('script:enableDepositTerms');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async (network) => {
  const { depositTerms } = config.get('contract');
  debug(`Enable deposit terms: ${depositTerms}`);
  const protocol = await Protocol.deployed();
  await protocol.enableDepositTerms(depositTerms);
});
