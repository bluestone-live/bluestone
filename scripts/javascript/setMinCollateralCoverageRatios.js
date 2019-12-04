const debug = require('debug')('script:setMinCollateralCoverageRatio');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript, toFixedBN } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadNetwork(network);
  const { loanAndCollateralTokenPairs } = config.get('contract');
  const tokenSymbolList = Object.keys(tokens);
  for (symbol of tokenSymbolList) {
    let token = tokens[symbol];
    if (!token.address) {
      return debug(`${symbol} is not deployed yet.`);
    }
    const selectedPairs = loanAndCollateralTokenPairs.filter(
      pair => pair.loanTokenSymbol === symbol,
    );
    if (selectedPairs.length > 0) {
      const collateralTokenAddressList = selectedPairs
        .map(pair => pair.collateralTokenSymbol)
        .map(symbol => tokens[symbol].address);
      const minCollateralCoverageRatioList = selectedPairs.map(pair =>
        toFixedBN(pair.minCollateralCoverageRatio).toString(),
      );
      const protocol = await Protocol.deployed();
      await protocol.setMinCollateralCoverageRatiosForToken(
        token.address,
        collateralTokenAddressList,
        minCollateralCoverageRatioList,
      );
      debug(`Set ${symbol} min collateral coverage ratio`);
    }
  }
});
