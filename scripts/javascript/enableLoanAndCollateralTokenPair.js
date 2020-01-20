const debug = require('debug')('script:enableLoanAndCollateralTokenPair');
const ERC20Mock = artifacts.require('./ERC20Mock.sol');
const Protocol = artifacts.require('./Protocol.sol');
const { loadNetwork, makeTruffleScript } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadNetwork(network);
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
    const protocol = await Protocol.deployed();
    await protocol.enableLoanAndCollateralTokenPair(
      loanToken.address,
      collateralToken.address,
    );
    debug(
      `Loan pair: ${pair.collateralTokenSymbol} -> ${pair.loanTokenSymbol} is enabled.`,
    );
  }
});
