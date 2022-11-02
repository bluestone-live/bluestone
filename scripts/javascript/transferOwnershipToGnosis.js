const debug = require('debug')('script:transferOwnershipToGnosis');
const { loadNetwork, makeTruffleScript } = require('../utils.js');
const config = require('config');
const Protocol = artifacts.require('Protocol');
const LinearInterestRateModel = artifacts.require('LinearInterestRateModel');
const MappingInterestRateModel = artifacts.require('MappingInterestRateModel');

module.exports = makeTruffleScript(async (network) => {
  const { contracts } = loadNetwork(network);
  const gnosisAddress = config.get('contract.gnosis');
  const modelSelect = config.get('contract.interestRateModel.select');

  const protocol = await Protocol.at(contracts.Protocol);
  let interestRateModel;
  if (modelSelect === 'Linear') {
    interestRateModel = await LinearInterestRateModel.at(
      contracts.LinearInterestRateModel,
    );
  } else if (modelSelect === 'Mapping') {
    interestRateModel = await MappingInterestRateModel.at(
      contracts.MappingInterestRateModel,
    );
  } else {
    return debug('Selected interestRateModel set error in config file');
  }

  await Promise.all([
    protocol.transferOwnership(gnosisAddress),
    interestRateModel.transferOwnership(gnosisAddress),
  ]);

  debug(`Transfer ownership to ${gnosisAddress} success.`);
});
