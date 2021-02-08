const debug = require('debug')('script:disableDepositTerm');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async (network, term) => {
  const protocol = await Protocol.deployed();
  debug(`disable deposit term: ${term}`);
  await protocol.disableDepositTerm(term);
});
