const debug = require('debug')('script:setupEnvironment');
const { makeTruffleScript } = require('../utils.js');
const path = require('path');
const shell = require('shelljs');

const exec = (scriptName, network) =>
  shell.exec(
    `truffle exec ${path.resolve(
      __dirname,
      `./${scriptName}.js`,
    )} --network ${network}`,
  );

module.exports = makeTruffleScript(async network => {
  if (network === 'development') {
    debug('Deploy Tokens');
    exec('deployTokens', network);

    debug('Deploy price oracles');
    exec('deployPriceOracles', network);
  }
  debug('Setup Deposit Environment');
  exec('enableDepositTerm', network);
  exec('enableDepositToken', network);

  debug('Setup Loan Environment');
  exec('enableLoanAndCollateralTokenPair', network);
  exec('setMinCollateralCoverageRatios', network);
  exec('setLiquidationDiscountsForToken', network);

  debug('Set Miscellaneous');
  exec('setInterestModel', network);
  exec('setProtocolAddress', network);
  exec('setProtocolReserveRatio', network);
  exec('setMaxDistributorFeeRatios', network);
  exec('setLoanInterestRates', network);

  debug('Post Token Prices');
  exec('postDaiPrice', network);
});
