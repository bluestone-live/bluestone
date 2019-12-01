const {
  makeTruffleScript,
  loadConfig,
  mergeConfig,
  toFixedBN,
} = require('../utils.js');
const debug = require('debug')('script:deployPriceOracles');
const MedianizerMock = artifacts.require('MedianizerMock');
const EthPriceOracle = artifacts.require('EthPriceOracle');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const FixedPriceOracle = artifacts.require('FixedPriceOracle');
const Protocol = artifacts.require('Protocol');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadConfig(network);

  // TODO(desmond): use WETH instead of ETH after wrap is complete?
  const { ETH, DAI, USDT } = tokens;

  if (!ETH || !DAI || !USDT) {
    throw new Error('Please ensure tokens are deployed.');
  }

  // TODO(desmond): use exisiting medianizer for main net
  const medianizer = await MedianizerMock.new();
  const ethPriceOracle = await EthPriceOracle.new(medianizer.address);
  const daiPriceOracle = await SingleFeedPriceOracle.new();
  const usdtPriceOracle = await FixedPriceOracle.new(toFixedBN(1));
  const protocol = await Protocol.deployed();

  const setPriceOracle = async (
    tokenSymbol,
    tokenAddress,
    priceOracleAddress,
  ) => {
    debug(`Set ${tokenSymbol} price oracle address: ${priceOracleAddress}`);
    await protocol.setPriceOracle(tokenAddress, priceOracleAddress);

    mergeConfig(
      network,
      ['tokens', tokenSymbol, 'priceOracleAddress'],
      priceOracleAddress,
    );
  };

  await setPriceOracle('ETH', ETH.tokenAddress, ethPriceOracle.address);
  await setPriceOracle('DAI', DAI.tokenAddress, daiPriceOracle.address);
  await setPriceOracle('USDT', USDT.tokenAddress, usdtPriceOracle.address);
});
