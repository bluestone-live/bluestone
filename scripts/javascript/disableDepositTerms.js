const debug = require('debug')('script:disableDepositTerms');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async (network, ...terms) => {
  debug(`Disable deposit terms: ${terms}`);
  const protocol = await Protocol.deployed();
  await protocol.disableDepositTerms(terms);
});
