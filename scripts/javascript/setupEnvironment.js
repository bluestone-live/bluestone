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

module.exports = makeTruffleScript(async (network) => {
  debug('1.[Deploy Tokens]');
  exec('deployTokens', network);

  debug('2.[Deploy price oracles]');
  exec('deployPriceOracles', network);

  debug('3.[Setup Deposit Environment]');
  exec('enableDepositTerms', network);
  exec('enableDepositToken', network);
  exec('disableDepositToken', network, 'xBTC');
  exec('disableDepositToken', network, 'ETH');

  debug('4.[Setup Loan Environment]');
  exec('setLoanAndCollateralTokenPairs', network);

  debug('5.[Set Miscellaneous]');
  exec('setInterestRateModel', network);
  exec('setInterestReserveAddress', network);
  exec('setProtocolReserveRatio', network);
  exec('setMaxDistributorFeeRatios', network);
  exec('setLoanInterestRates', network);
  exec('setBalanceCaps', network);
});
