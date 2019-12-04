const { makeTruffleScript, saveNetwork, loadNetwork } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const debug = require('debug')('script:deployTokens');
  const ERC20Mock = artifacts.require('./ERC20Mock.sol');
  const USDTMock = artifacts.require('./USDTMock.sol');
  const WrappedEther = artifacts.require('./WrappedEther.sol');

  const { tokens } = loadNetwork(network);

  const tokenSymbolList = Object.keys(tokens);

  for (symbol of tokenSymbolList) {
    let token = tokens[symbol];
    if (symbol === 'WETH') {
      deployedToken = await WrappedEther.new();
    } else if (symbol === 'USDT') {
      deployedToken = await USDTMock.new(token.name, symbol);
    } else {
      deployedToken = await ERC20Mock.new(token.name, symbol);
    }
    debug(`Deployed ${symbol} at ${deployedToken.address}`);

    saveNetwork(network, ['tokens', symbol, 'address'], deployedToken.address);
  }
});
