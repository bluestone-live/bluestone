const { makeTruffleScript, loadNetwork } = require('../utils.js');
const debug = require('debug')('script:setPriceOracles');
const Protocol = artifacts.require('Protocol');

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
});
