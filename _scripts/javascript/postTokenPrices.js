const debug = require('debug')('script:postTokenPrices');
const PriceOracle = artifacts.require('./_PriceOracle.sol');
const {
  fetchTokenPrices,
  makeTruffleScript,
  toFixedBN,
} = require('./utils.js');

/**
 * Given a list of tokens, each with name and deployed address,
 * this script does the following:
 * 1. Fetch the latest token price in USD
 * 2. Scale the price by 10**18 and convert to BN instance
 * 3. Post the price to PriceOracle contract
 */
module.exports = makeTruffleScript(async () => {
  const { tokens } = loadConfig(network);
  const tokenSymbolList = Object.keys(tokens);
  const tokenAddressList = tokenSymbolList.map(
    tokenSymbol => tokens[tokenSymbol].tokenAddress,
  );

  const priceList = await fetchTokenPrices(tokenSymbolList, 'USD');

  const scaledPriceList = priceList.map(price => toFixedBN(price));

  const priceOracle = await PriceOracle.deployed();

  debug('Token addresses: %o', tokenAddressList);
  debug('Token prices scaled by 1e18: %o', scaledPriceList);
  debug('Posting prices to oracle...');
  await priceOracle.setPrices(tokenAddressList, scaledPriceList);

  return scaledPriceList;
});
