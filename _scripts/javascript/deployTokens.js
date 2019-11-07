const debug = require('debug')('script:deployTokens');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const USDTMock = artifacts.require('./USDTMock.sol');
const WrappedEther = artifacts.require('./WrappedEther.sol');
const { makeTruffleScript, mergeConfig, loadConfig } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadConfig(network);

  const tokenSymbolList = Object.keys(tokens);
  for (symbol of tokenSymbolList) {
    let token = tokens[symbol];
    if (symbol === 'WETH') {
      deployedToken = await WrappedEther.new();
    } else if (symbol === 'USDT') {
      deployedToken = await USDTMock.new(token.tokenName, symbol);
    } else {
      deployedToken = await ERC20Mock.new(token.tokenName, symbol);
    }
    debug(`Deployed ${symbol} at ${deployedToken.address}`);
    tokens[symbol].tokenAddress = deployedToken.address;

    mergeConfig(
      network,
      ['tokens', symbol, 'tokenAddress'],
      deployedToken.address,
    );
  }

  return tokens;
});
