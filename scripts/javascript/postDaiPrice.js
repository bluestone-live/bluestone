const debug = require('debug')('script:postDaiPrice');
const MedianizerMock = artifacts.require('MedianizerMock');
const OasisDexMock = artifacts.require('OasisDexMock');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const { loadNetwork, makeTruffleScript, toFixedBN } = require('../utils.js');
const CryptoCompare = require('../../libs/CryptoCompare.js');
const config = require('config');
const { BN, toBN } = require('web3-utils');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadNetwork(network);
  const { ETH, DAI } = tokens;
  let priceList = [];

  const medianizer = await MedianizerMock.deployed();

  // 1. Get ETH/USD from MakerDao and ETH/DAI from Oasis to compute DAI/USD
  try {
    const { '0': hex } = await medianizer.peek();
    const ethPrice = toBN(hex);

    try {
      const eth2daiPrice = await getPriceFromOasis(DAI.address, ETH.address);
      const daiPrice = ethPrice.mul(toFixedBN(1)).div(eth2daiPrice);
      priceList.push(daiPrice);
    } catch (err) {
      debug('Failed to get ETH/DAI from oasis: %o', err);
    }
  } catch (err) {
    debug('Failed to get ETH/USD from Medianizer: %o', err);
  }

  const cryptoCompare = new CryptoCompare(config.get('cryptocompare.apiKey'));

  // Get DAI/USDC from Coinbase
  try {
    const { USDC } = await cryptoCompare.getSingleSymbolPrice({
      fsym: 'DAI',
      tsyms: 'USDC',
      e: 'coinbase',
    });
    priceList.push(toFixedBN(USDC));
  } catch (err) {
    debug('Failed to get price on Coinbase from CryptoCompare: %o', err);
  }

  // Get DAI/USD from Bitfinex
  try {
    const { USD } = await cryptoCompare.getSingleSymbolPrice({
      fsym: 'DAI',
      tsyms: 'USD',
      e: 'bitfinex',
    });
    priceList.push(toFixedBN(USD));
  } catch (err) {
    debug('Failed to get price on Coinbase from CryptoCompare: %o', err);
  }

  if (priceList.length === 0) {
    throw new Error('Failed to fetch any price data.');
  }

  // Compute the average price
  const sumPrice = priceList.reduce((acc, val) => acc.add(val), new BN(0));
  const avgPrice = sumPrice.div(new BN(priceList.length));
  debug(`Average price: ${avgPrice.toString()}`);

  /**
   * Post the price to price oracle if any of the following condition met:
   * 1. If price changes by more than 2%
   * 2. No price update within 6 hours
   */
  const daiPriceOracle = await SingleFeedPriceOracle.at(DAI.priceOracleAddress);
  const maxSpread = new BN(2).mul(toFixedBN(1)).div(new BN(100));
  debug(`Max price spread: ${maxSpread.toString()}`);
  const currPrice = await daiPriceOracle.getPrice();
  debug(`Current on-chain price: ${currPrice.toString()}`);
  const spread = currPrice
    .mul(toFixedBN(1))
    .div(avgPrice)
    .sub(toFixedBN(1))
    .abs();
  debug(`Current price spread: ${spread.toString()}`);

  if (spread.gt(maxSpread)) {
    debug(`Posting DAI price to ${DAI.priceOracleAddress}`);
    await daiPriceOracle.setPrice(avgPrice);
  } else {
    // TODO(desmond): update price if no update within 6 hours

    debug('Price spread is <= 2%, do nothing.');
  }
});

async function getPriceFromOasis(DaiTokenAddress, EthTokenAddress) {
  // TODO(desmond): use existing OasisDex for mainnet
  const oasisDex = await OasisDexMock.deployed();
  const isClosed = await oasisDex.isClosed();
  const buyEnabled = await oasisDex.buyEnabled();
  const matchingEnabled = await oasisDex.matchingEnabled();

  if (isClosed || !buyEnabled || !matchingEnabled) {
    throw new Error('Oasis is not operational.');
  }

  const oasisEthAmount = toFixedBN(10);
  const bidAmount = await oasisDex.getBuyAmount(
    DaiTokenAddress,
    EthTokenAddress,
    oasisEthAmount,
  );
  const askAmount = await oasisDex.getPayAmount(
    DaiTokenAddress,
    EthTokenAddress,
    oasisEthAmount,
  );
  const bidPrice = bidAmount.mul(toFixedBN(1)).div(oasisEthAmount);
  const askPrice = askAmount.mul(toFixedBN(1)).div(oasisEthAmount);
  const daiPrice = bidPrice.add(askPrice).div(new BN(2));

  return daiPrice;
}
