const debug = require('debug')('script:setInterestModel');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { contracts } = loadNetwork(network);
  let interestModelAddress = contracts.InterestModel;
  const proxyAddress = contracts.OwnedUpgradeabilityProxy;

  if (!interestModelAddress) {
    return debug('Interest model is not deployed yet');
  }

  const protocol = await Protocol.at(proxyAddress);
  await protocol.setInterestModel(interestModelAddress);
  return debug('Interest model is set');
});
