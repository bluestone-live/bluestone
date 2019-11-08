const debug = require('debug')('script:disableDepositToken');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadConfig, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async (network, tokenSymbol) => {
  const { tokens } = loadConfig(network);
  if (!tokens[tokenSymbol].tokenAddress) {
    debug('Invalid token symbol: ', tokenSymbol);
  } else {
    const protocol = await Protocol.deployed();
    await protocol.disableDepositToken(tokens[tokenSymbol].tokenAddress);
    debug(`${tokenSymbol} is disabled.`);
  }
});
