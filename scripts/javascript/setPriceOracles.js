const { makeTruffleScript, loadNetwork, toFixedBN } = require('../utils.js');
const debug = require('debug')('script:setPriceOracles');
const Protocol = artifacts.require('Protocol');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');

module.exports = makeTruffleScript(async (network) => {
  const { tokens } = loadNetwork(network);

  const protocol = await Protocol.deployed();

  const setPriceOracleForToken = async (tokenSymbol) => {
    const info = tokens[tokenSymbol];
    // Check if the token address and price oracle address are set.
    if (!info.address) {
      return debug(
        `Error setting price oracle for ${tokenSymbol}: token address not set`,
      );
    }
    if (!info.priceOracleAddress) {
      return debug(
        `Error setting price oracle for ${tokenSymbol}: oracle address not set`,
      );
    }

    debug(
      `Set ${tokenSymbol} price oracle address: ${info.priceOracleAddress}`,
    );
    await protocol.setPriceOracle(info.address, info.priceOracleAddress);
  };

  await Promise.all(
    Object.keys(tokens).map((token) => setPriceOracleForToken(token)),
  );

  // Set an initial price $1000 for the WETH oracle.
  // For production, we need to have a price feeder to update the WETH oracle
  // in real-time. But for development/testing, we leave it as the init price.
  if (tokens.WETH) {
    const wethPriceOracle = await SingleFeedPriceOracle.at(
      tokens.WETH.priceOracleAddress,
    );
    await wethPriceOracle.setPrice(toFixedBN(1000));
    debug('Set WETH price: $1000');
  }
});
