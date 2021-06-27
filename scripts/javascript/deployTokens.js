const config = require('config');
const { makeTruffleScript, saveNetwork } = require('../utils.js');

module.exports = makeTruffleScript(async (network) => {
  if (network === 'main' || network === 'rangers') {
    return;
  }

  const debug = require('debug')('script:deployTokens');
  const ERC20Mock = artifacts.require('./ERC20Mock.sol');
  const USDTMock = artifacts.require('./USDTMock.sol');

  const tokens = config.get('contract.tokens');

  const tokenSymbolList = Object.keys(tokens);

  for (const symbol of tokenSymbolList) {
    const token = tokens[symbol];
    let deployedToken;

    if (symbol === 'USDT') {
      deployedToken = await USDTMock.new(token.name, symbol);
    } else if (symbol === 'USDC') {
      deployedToken = await ERC20Mock.new(token.name, symbol, 6);
    } else if (symbol === 'WETH') {
      deployedToken = await ERC20Mock.new(token.name, symbol, 18);
    } else if (symbol === 'DAI') {
      deployedToken = await ERC20Mock.new(token.name, symbol, 10);
    } else if (symbol === 'ETH') {
      // We use address(1) to identify ETH
      deployedToken = Object.assign(
        {},
        {
          address: '0x0000000000000000000000000000000000000001',
        },
      );
    } else {
      throw Error('unknown token');
    }

    debug(`Deployed ${symbol} at ${deployedToken.address}`);

    saveNetwork(network, ['tokens', symbol, 'name'], token.name);
    saveNetwork(network, ['tokens', symbol, 'address'], deployedToken.address);
  }
});
