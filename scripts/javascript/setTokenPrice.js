const debug = require('debug')('script:setTokenPrice');
const Protocol = artifacts.require('./Protocol.sol');
const MedianizerMock = artifacts.require('MedianizerMock');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const { loadNetwork, makeTruffleScript, toFixedBN } = require('../utils.js');

const oraclesByToken = {
  ETH: MedianizerMock,
  SGC: SingleFeedPriceOracle,
  xBTC: SingleFeedPriceOracle,
};

module.exports = makeTruffleScript(async (network, token, price) => {
  const { contracts, tokens } = loadNetwork(network);
  const tokenPrice = toFixedBN(parseFloat(price));

  const Oracle = oraclesByToken[token];
  if (!Oracle) {
    return debug(
      `<token> can only be one of ${Object.keys(oraclesByToken).join(', ')}`,
    );
  }

  const oracleAddr =
    token === 'ETH'
      ? contracts.MedianizerMock
      : tokens[token].priceOracleAddress;

  debug(`Setting ${token} price to ${tokenPrice.toString()} wei...`);
  const oracle = await Oracle.at(oracleAddr);
  await oracle.setPrice(tokenPrice);

  const protocol = await Protocol.at(contracts.Protocol);
  const currentPrice = await protocol.getTokenPrice(tokens[token].address);
  return debug(`${token} price is set to ${currentPrice.toString()}`);
});
