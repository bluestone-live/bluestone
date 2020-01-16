const config = require('config');
const { makeTruffleScript, saveNetwork, loadNetwork } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const debug = require('debug')('script:deployTokens');
  const ERC20Mock = artifacts.require('./ERC20Mock.sol');
  const USDTMock = artifacts.require('./USDTMock.sol');
  const WETH9 = artifacts.require('./WETH9.sol');

  const tokens = config.get('contract.tokens');

  const tokenSymbolList = Object.keys(tokens);

  let savedTokens = {};

  for (symbol of tokenSymbolList) {
    // We use address(1) to identify ETH
    if (symbol === 'ETH') {
      deployedToken = {
        address: '0x0000000000000000000000000000000000000001',
      };
    }
    let token = tokens[symbol];
    if (symbol === 'WETH') {
      deployedToken = await WETH9.new();
    } else if (symbol === 'USDT') {
      deployedToken = await USDTMock.new(token.name, symbol);
    } else {
      deployedToken = await ERC20Mock.new(token.name, symbol);
    }
    debug(`Deployed ${symbol} at ${deployedToken.address}`);
    savedTokens = {
      ...savedTokens,
      [symbol]: {
        name: token.name,
        address: deployedToken.address,
      },
    };
  }
  saveNetwork(network, ['tokens'], savedTokens);
});
