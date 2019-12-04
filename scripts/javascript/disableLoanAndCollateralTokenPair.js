const debug = require('debug')('script:disableLoanAndCollateralTokenPair');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(
  async (network, loanTokenSymbol, collateralTokenSymbol) => {
    const { tokens } = loadNetwork(network);
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
    const loanToken = await ERC20Mock.at(tokens[pair.loanTokenSymbol].address);
    const collateralToken = await ERC20Mock.at(
      tokens[pair.collateralTokenSymbol].address,
    );
    const protocol = await Protocol.deployed();
    await protocol.disableLoanAndCollateralTokenPair(
      loanToken.address,
      collateralToken.address,
    );
    debug(
      `Loan pair: ${pair.collateralTokenSymbol} -> ${pair.loanTokenSymbol} is disabled.`,
    );
  },
);
