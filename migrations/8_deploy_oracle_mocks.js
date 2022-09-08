const { toFixedBN, deploy } = require('../scripts/utils');

// const MedianizerMock = artifacts.require('MedianizerMock');
// const OasisDexMock = artifacts.require('OasisDexMock');
const ChainlinkMock = artifacts.require('ChainlinkMock');

module.exports = async function (deployer, network) {
  console.log(network);
  if (network !== 'main' && network !== 'main-fork') {
    const ethPrice = toFixedBN(200);

    // await deploy(deployer, network, MedianizerMock);
    // const medianizer = await MedianizerMock.deployed();
    // await medianizer.setPrice(ethPrice);

    // await deploy(deployer, network, OasisDexMock);
    // const oasisDex = await OasisDexMock.deployed();
    // await oasisDex.setEthPrice(ethPrice);

    await deploy(deployer, network, ChainlinkMock);
    const chainlink = await ChainlinkMock.deployed();
    await chainlink.setPrice(ethPrice);
  }
};
