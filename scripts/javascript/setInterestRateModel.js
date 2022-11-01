const debug = require('debug')('script:setInterestRateModel');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async (network) => {
  const { contracts } = loadNetwork(network);
  let interestRateModelAddress = contracts.InterestRateModel;
  if (!interestRateModelAddress) {
    return debug('Interest model is not deployed yet');
  }
  const protocol = await Protocol.deployed();
  await protocol.setInterestRateModel(interestRateModelAddress);
  return debug('Interest model is set');
});
