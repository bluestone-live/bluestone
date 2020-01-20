const debug = require('debug')('script:mintTokens');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const { makeTruffleScript, toFixedBN, loadNetwork } = require('../utils.js');

module.exports = makeTruffleScript(async (network, accountAddress) => {
  const { tokens } = loadNetwork(network);
  const tokenSymbolList = Object.keys(tokens);
  for (symbol of tokenSymbolList) {
    let token = tokens[symbol];
    if (!token.address) {
      debug(`${symbol} is not deployed yet.`);
      return;
    }
    if (symbol === 'ETH') {
      continue;
    }
    const erc20 = await ERC20Mock.at(token.address);
    const scaledValue = toFixedBN(1000000);
    debug(`Token symbol: ${symbol}`);
    debug(`Account address: ${accountAddress}`);
    debug(`Token amount in wei: ${scaledValue}`);

    await erc20.mint(accountAddress, scaledValue);
  }
});
