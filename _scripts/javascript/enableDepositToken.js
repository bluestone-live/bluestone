const debug = require('debug')('script:enableDepositToken');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetworkConfig, makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadNetworkConfig(network);
  const tokenSymbolList = Object.keys(tokens);
  for (symbol of tokenSymbolList) {
    let token = tokens[symbol];
    if (!token.tokenAddress) {
      debug(`${symbol} is not deployed yet.`);
      return;
    }
    let deployedToken = await ERC20Mock.at(token.tokenAddress);
    const protocol = await Protocol.deployed();
    await protocol.enableDepositToken(deployedToken.address);
    debug(`${symbol} is enabled.`);
  }
});
