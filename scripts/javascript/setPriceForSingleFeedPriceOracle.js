const { makeTruffleScript, loadNetwork, toFixedBN } = require('../utils.js');
const debug = require('debug')('script:setPriceOracles');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');

module.exports = makeTruffleScript(async (network, token, price) => {
  const { tokens } = loadNetwork(network);
  const tokenInfo = tokens[token];

  if (!tokenInfo || !tokenInfo.priceOracleAddress) {
    return debug('price oracle not set');
  }

  const oracle = await SingleFeedPriceOracle.at(tokenInfo.priceOracleAddress);
  await oracle.setPrice(toFixedBN(price));
});
