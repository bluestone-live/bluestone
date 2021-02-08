const debug = require('debug')('script:setBalanceCaps');
const Protocol = artifacts.require('./Protocol.sol');
const { makeTruffleScript, loadNetwork, toFixedBN } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async (network) => {
  const protocol = await Protocol.deployed();

  const { tokens } = loadNetwork(network);
  const tokenSymbols = Object.keys(tokens);

  await Promise.all(
    tokenSymbols.map(async (symbol) => {
      const tokenAddress = tokens[symbol].address;
      const tokenBalanceCap = config.get('contract.tokens')[symbol].balanceCap;

      await protocol.setBalanceCap(tokenAddress, toFixedBN(tokenBalanceCap));

      debug(`Set token balance cap: ${tokenAddress} ${tokenBalanceCap}`);
    }),
  );
});
