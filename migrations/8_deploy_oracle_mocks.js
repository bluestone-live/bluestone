const { toFixedBN } = require('../scripts/utils');

const MedianizerMock = artifacts.require('MedianizerMock');
const OasisDexMock = artifacts.require('OasisDexMock');

module.exports = async function (deployer, network) {
  console.log(network);
  if (network !== 'main' && network !== 'main-fork') {
    const ethPrice = toFixedBN(200);

    await deployer.deploy(MedianizerMock);
    const medianizer = await MedianizerMock.deployed();
    await medianizer.setPrice(ethPrice);

    await deployer.deploy(OasisDexMock);
    const oasisDex = await OasisDexMock.deployed();
    await oasisDex.setEthPrice(ethPrice);
  }
};
