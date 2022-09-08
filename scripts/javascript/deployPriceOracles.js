const {
  makeTruffleScript,
  loadNetwork,
  saveNetwork,
  toFixedBN,
} = require('../utils.js');
// const { BN } = require('web3-utils');
const config = require('config');
const debug = require('debug')('script:deployPriceOracles');
// const MedianizerMock = artifacts.require('MedianizerMock');
// const OasisDexMock = artifacts.require('OasisDexMock');
const ChainlinkMock = artifacts.require('ChainlinkMock');
const EthPriceOracle = artifacts.require('EthPriceOracle');
// const FixedPriceOracle = artifacts.require('FixedPriceOracle');
// const DaiPriceOracle = artifacts.require('DaiPriceOracle');
const BtcPriceOracle = artifacts.require('BtcPriceOracle');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
// const ERC20Mock = artifacts.require('ERC20Mock');
const Protocol = artifacts.require('Protocol');

module.exports = makeTruffleScript(async (network) => {
  const { tokens } = loadNetwork(network);

  const { ETH, SGC, xBTC } = tokens;

  if (!ETH || !SGC || !xBTC) {
    throw new Error('Please ensure tokens are deployed.');
  }

  // const medianizer =
  //   network === 'main'
  //     ? { address: '0x729D19f657BD0614b4985Cf1D82531c67569197B' } // Medianizer address
  //     : await MedianizerMock.deployed();
  // const ethPriceOracle = await EthPriceOracle.new(medianizer.address);

  // const xbtcPriceOracle = await SingleFeedPriceOracle.new();
  // await xbtcPriceOracle.setPrice(toFixedBN(45000));

  // ETH price oracle
  const ethPriceOracle =
    network === 'goerli' || network === 'main'
      ? await EthPriceOracle.new(config.get('contract.tokens.ETH.aggregator'))
      : await ChainlinkMock.deployed();

  // xBTC price oracle
  const xbtcPriceOracle =
    network === 'goerli' || network === 'main'
      ? await BtcPriceOracle.new(config.get('contract.tokens.xBTC.aggregator'))
      : await ChainlinkMock.deployed();

  // SGC price oracle
  const sgcPriceOracle = await SingleFeedPriceOracle.new();
  await sgcPriceOracle.setPrice(toFixedBN(1));

  const protocol = await Protocol.deployed();
  const setPriceOracle = async (
    tokenSymbol,
    tokenAddress,
    priceOracleAddress,
  ) => {
    debug(`Set ${tokenSymbol} price oracle address: ${priceOracleAddress}`);
    await protocol.setPriceOracle(tokenAddress, priceOracleAddress);

    saveNetwork(
      network,
      ['tokens', tokenSymbol, 'priceOracleAddress'],
      priceOracleAddress,
    );
  };

  await Promise.all([
    setPriceOracle('ETH', ETH.address, ethPriceOracle.address),
    setPriceOracle('SGC', SGC.address, sgcPriceOracle.address),
    setPriceOracle('xBTC', xBTC.address, xbtcPriceOracle.address),
  ]);
});
