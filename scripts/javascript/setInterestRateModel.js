const debug = require('debug')('script:setInterestRateModel');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async (network) => {
  const protocol = await Protocol.deployed();
  const modelSelect = config.get(`contract.interestRateModel.select`);
  const { contracts } = loadNetwork(network);

  if (modelSelect === 'Linear') {
    await protocol.setInterestRateModel(contracts.LinearInterestRateModel);
    debug(
      `Linear interest rate model ${contracts.LinearInterestRateModel} is set`,
    );
  } else if (modelSelect === 'Mapping') {
    await protocol.setInterestRateModel(contracts.MappingInterestRateModel);
    debug(
      `Mapping interest rate model ${contracts.MappingInterestRateModel} is set`,
    );
  } else {
    return debug("Interest rate model haven't selected in config file");
  }
});
