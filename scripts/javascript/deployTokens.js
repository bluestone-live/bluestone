const debug = require('debug')('script:deployTokens');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const WrappedEther = artifacts.require('./WrappedEther.sol');
const { makeTruffleScript, mergeNetworkConfig } = require('./utils.js');
const { configuration } = require('../../config.js');

module.exports = makeTruffleScript(async network => {
  const { tokens } = configuration;

  const tokenSymbolList = Object.keys(tokens);

  for (let i = 0; i < tokenSymbolList.length; i++) {
    const symbol = tokenSymbolList[i];
    const { name } = tokens[symbol];
    let deployedToken;

    if (symbol === 'WETH') {
      deployedToken = await WrappedEther.new();
    } else {
      deployedToken = await ERC20Mock.new(name, symbol);
    }

    debug(`Deployed ${symbol} at ${deployedToken.address}`);
    tokens[symbol].address = deployedToken.address;
  }

  mergeNetworkConfig(network, ['tokens'], tokens);

  return tokens;
});
