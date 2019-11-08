const debug = require('debug')('script:setMinCollateralCoverageRatio');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadConfig, makeTruffleScript, toFixedBN } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { tokens, loanAndCollateralTokenPairs } = loadConfig(network);
  const tokenSymbolList = Object.keys(tokens);
  for (symbol of tokenSymbolList) {
    let token = tokens[symbol];
    if (!token.tokenAddress) {
      return debug(`${symbol} is not deployed yet.`);
    }
    const selectedPairs = loanAndCollateralTokenPairs.filter(
      pair => pair.loanTokenSymbol === symbol,
    );
    if (selectedPairs.length > 0) {
      const collateralTokenAddressList = selectedPairs
        .map(pair => pair.collateralTokenSymbol)
        .map(symbol => tokens[symbol].tokenAddress);
      const minCollateralCoverageRatioList = selectedPairs.map(pair =>
        toFixedBN(pair.minCollateralCoverageRatio).toString(),
      );
      const protocol = await Protocol.deployed();
      await protocol.setMinCollateralCoverageRatiosForToken(
        token.tokenAddress,
        collateralTokenAddressList,
        minCollateralCoverageRatioList,
      );
      debug(`Set ${symbol} min collateral coverage ratio`);
    }
  }
});
