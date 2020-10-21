const debug = require('debug')('script:removeLoanAndCollateralTokenPair');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(
  async (network, loanTokenSymbol, collateralTokenSymbol) => {
    const {
      tokens,
      contracts: { OwnedUpgradeabilityProxy: proxyAddress },
    } = loadNetwork(network);
    const { loanAndCollateralTokenPairs } = config.get('contract');

    if (!loanTokenSymbol || !collateralTokenSymbol) {
      return debug(`Invalid arguments`);
    }
    const pair = loanAndCollateralTokenPairs.find(
      pair =>
        pair.loanTokenSymbol === loanTokenSymbol &&
        pair.collateralTokenSymbol === collateralTokenSymbol,
    );
    if (!pair) {
      return debug(
        `Invalid arguments loan: ${loanTokenSymbol}, collateral: ${collateralTokenSymbol}`,
      );
    }
    const loanToken = tokens[pair.loanTokenSymbol];
    const collateralToken = tokens[pair.collateralTokenSymbol];

    if (!loanToken || !loanToken.address) {
      return debug(`${pair.loanTokenSymbol} is not deployed yet.`);
    }

    if (!collateralToken || !collateralToken.address) {
      return debug(`${pair.collateralTokenSymbol} is not deployed yet.`);
    }

    const protocol = await Protocol.at(proxyAddress);
    await protocol.removeLoanAndCollateralTokenPair(
      loanToken.address,
      collateralToken.address,
    );
    debug(
      `Loan pair: ${pair.collateralTokenSymbol} -> ${pair.loanTokenSymbol} is disabled.`,
    );
  },
);
