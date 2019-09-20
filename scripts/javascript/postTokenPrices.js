const debug = require('debug')('script:postTokenPrices');
const PriceOracle = artifacts.require('./PriceOracle.sol');
const {
  fetchTokenPrices,
  getTokenAddress,
  makeTruffleScript,
} = require('./utils.js');

/**
 * Given a list of tokens, each with name and deployed address,
 * this script does the following:
 * 1. Fetch the latest token price in USD
 * 2. Scale the price by 10**18 and convert to BN instance
 * 3. Post the price to PriceOracle contract
 */
module.exports = makeTruffleScript(async () => {
  const tokenSymbolList = ['ETH', 'DAI', 'USDT'];
  let tokenAddressList = [];

  for (let i = 0; i < tokenSymbolList.length; i++) {
    const symbol = tokenSymbolList[i];
    const address = await getTokenAddress(symbol);
    tokenAddressList.push(address);
  }

  const priceList = await fetchTokenPrices(tokenSymbolList, 'USD');

  const scaledPriceList = priceList
    .map(decimal => decimal * Math.pow(10, 18))
    .map(web3.utils.toBN);

  const priceOracle = await PriceOracle.deployed();

  debug('Token addresses: %o', tokenAddressList);
  debug('Token prices scaled by 1e18: %o', scaledPriceList);
  debug('Posting prices to oracle...');
  await priceOracle.setPrices(tokenAddressList, scaledPriceList);

  return scaledPriceList;
});
