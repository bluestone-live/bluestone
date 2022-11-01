const debug = require('debug')('script:transferOwnershipToGnosis');
const { loadNetwork, makeTruffleScript } = require('../utils.js');
const config = require('config');
const Protocol = artifacts.require('Protocol');
const LinearInterestRateModel = artifacts.require('LinearInterestRateModel');
const MappingInterestRateModel = artifacts.require('MappingInterestRateModel');

module.exports = makeTruffleScript(async (network) => {
  const { contracts } = loadNetwork(network);
  const gnosisAddress = config.get('contract.gnosis');

  const protocol = await Protocol.at(contracts.Protocol);
  let interestRateModel;
  if (
    contracts.LinearInterestRateModel &&
    contracts.InterestRateModel === contracts.LinearInterestRateModel
  ) {
    interestRateModel = await LinearInterestRateModel.at(
      contracts.LinearInterestRateModel,
    );
  } else if (
    contracts.MappingInterestRateModel &&
    contracts.InterestRateModel === contracts.MappingInterestRateModel
  ) {
    interestRateModel = await MappingInterestRateModel.at(
      contracts.MappingInterestRateModel,
    );
  }

  await Promise.all([
    protocol.transferOwnership(gnosisAddress),
    interestRateModel.transferOwnership(gnosisAddress),
  ]);

  debug(`Transfer ownership to ${gnosisAddress} success.`);
});
