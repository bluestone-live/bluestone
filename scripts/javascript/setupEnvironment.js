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
  debug('Deploy Tokens');
  exec('deployTokens', network);

  debug('Set price oracles');
  exec('setPriceOracles', network);

  debug('Setup Deposit Environment');
  exec('enableDepositTerms', network);
  exec('enableDepositTokens', network);

  debug('Setup Loan Environment');
  exec('setLoanAndCollateralTokenPairs', network);

  debug('Set Miscellaneous');
  exec('setInterestModel', network);
  exec('setInterestReserveAddress', network);
  exec('setProtocolReserveRatio', network);
  exec('setMaxDistributorFeeRatios', network);
  exec('setLoanInterestRates', network);
  exec('setBalanceCaps', network);
});
