const debug = require('debug')('script:setInterestReserveAddress');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript, loadNetwork } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const {
    contracts: { OwnedUpgradeabilityProxy: proxyAddress },
  } = loadNetwork(network);

  const { interestReserveAddress } = config.get('contract');
  const protocol = await Protocol.at(proxyAddress);
  await protocol.setInterestReserveAddress(interestReserveAddress);
  debug(`Set interest reserve address: ${interestReserveAddress}`);
});
