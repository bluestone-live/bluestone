const { toFixedBN } = require('../scripts/utils');

const MedianizerMock = artifacts.require('MedianizerMock');
const OasisDexMock = artifacts.require('OasisDexMock');

module.exports = async function (deployer, network) {
  console.log('No need to deploy oracle mocks to Rocket Protocol');
};
