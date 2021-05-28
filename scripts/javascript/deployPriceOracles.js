const {
  makeTruffleScript,
  loadNetwork,
  saveNetwork,
  toFixedBN,
} = require('../utils.js');
const debug = require('debug')('script:deployPriceOracles');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const FixedPriceOracle = artifacts.require('FixedPriceOracle');
const Protocol = artifacts.require('Protocol');

module.exports = makeTruffleScript(async (network) => {
  const { tokens } = loadNetwork(network);

  const { WETH, USDT } = tokens;

  if (!WETH || !USDT) {
    throw new Error('Please ensure tokens are deployed.');
  }

  const wethPriceOracle = await SingleFeedPriceOracle.new();
  const fixedPriceOracle = await FixedPriceOracle.new(toFixedBN(1));
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
    setPriceOracle('WETH', WETH.address, wethPriceOracle.address),
    setPriceOracle('USDT', USDT.address, fixedPriceOracle.address),
  ]);
});
