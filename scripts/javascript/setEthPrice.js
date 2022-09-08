const debug = require('debug')('script:setEthPrice');
const Protocol = artifacts.require('./Protocol.sol');
// const MedianizerMock = artifacts.require('MedianizerMock');
const ChainlinkMock = artifacts.require('ChainlinkMock');
const { loadNetwork, makeTruffleScript, toFixedBN } = require('../utils.js');

module.exports = makeTruffleScript(async (network, price) => {
  const { contracts } = loadNetwork(network);
  const ethPrice = toFixedBN(parseInt(price));

  // const medianizer = await MedianizerMock.at(contracts.MedianizerMock);
  // await medianizer.setPrice(ethPrice);

  const chainlink = await ChainlinkMock.at(contracts.ChainlinkMock);
  await chainlink.setPrice(ethPrice);

  const protocol = await Protocol.at(contracts.Protocol);
  const currentPrice = await protocol.getTokenPrice(
    '0x0000000000000000000000000000000000000001',
  );
  return debug(`ETH price is set to ${currentPrice.toString()}`);
});
