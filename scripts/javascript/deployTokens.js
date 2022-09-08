const config = require('config');
const { makeTruffleScript, saveNetwork } = require('../utils.js');

module.exports = makeTruffleScript(async (network) => {
  if (network === 'main') {
    return;
  }

  const debug = require('debug')('script:deployTokens');
  const ERC20Mock = artifacts.require('./ERC20Mock.sol');
  const USDTMock = artifacts.require('./USDTMock.sol');

  const tokens = config.get('contract.tokens');
  console.log('[deployTokens]: ', tokens);

  const tokenSymbolList = Object.keys(tokens);

  let savedTokens = {};

  for (const symbol of tokenSymbolList) {
    const token = tokens[symbol];
    let deployedToken;

    if (symbol === 'USDT') {
      deployedToken = await USDTMock.new(token.name, symbol);
    } else if (symbol === 'USDC') {
      deployedToken = await ERC20Mock.new(token.name, symbol, 6);
    } else if (symbol === 'ETH') {
      // We use address(1) to identify ETH
      deployedToken = Object.assign(
        {},
        {
          address: '0x0000000000000000000000000000000000000001',
        },
      );
    } else {
      deployedToken = await ERC20Mock.new(token.name, symbol, 18);
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
