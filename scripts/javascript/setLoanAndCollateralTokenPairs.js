const debug = require('debug')('script:setLoanAndCollateralTokenPairs');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript, toFixedBN } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const {
    tokens,
    contracts: { OwnedUpgradeabilityProxy: proxyAddress },
  } = loadNetwork(network);

  const { loanAndCollateralTokenPairs } = config.get('contract');

  for (pair of loanAndCollateralTokenPairs) {
    if (!pair.loanTokenSymbol || !pair.collateralTokenSymbol) {
      return debug(`Invalid token pair config`);
    }
    if (
      !tokens[pair.loanTokenSymbol] ||
      !tokens[pair.loanTokenSymbol].address
    ) {
      return debug(`${pair.loanTokenSymbol} is not deployed yet.`);
    }
    if (
      !tokens[pair.collateralTokenSymbol] ||
      !tokens[pair.collateralTokenSymbol].address
    ) {
      return debug(`${pair.collateralTokenSymbol} is not deployed yet.`);
    }
    const loanToken = tokens[pair.loanTokenSymbol];
    const collateralToken = tokens[pair.collateralTokenSymbol];
    const protocol = await Protocol.at(proxyAddress);
    await protocol.setLoanAndCollateralTokenPair(
      loanToken.address,
      collateralToken.address,
      toFixedBN(pair.minCollateralCoverageRatio),
      toFixedBN(pair.liquidationDiscount),
    );
    debug(
      `Loan pair: ${pair.collateralTokenSymbol} -> ${pair.loanTokenSymbol} is enabled.`,
    );
  }
});
