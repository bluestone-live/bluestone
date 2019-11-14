const debug = require('debug')('script:setLoanInterestRate');
const InterestModel = artifacts.require('./InterestModel.sol');
const { loadConfig, makeTruffleScript, toFixedBN } = require('../utils.js');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadConfig(network);
  const tokenSymbolList = Object.keys(tokens);

  const interestModel = await InterestModel.deployed();

  debug('Set loan interest rates');
  for (tokenSymbol of tokenSymbolList) {
    const {
      loanInterestRateLowerBound,
      loanInterestRateUpperBound,
      tokenAddress,
    } = tokens[tokenSymbol];
    await interestModel.setLoanParameters(
      tokenAddress,
      toFixedBN(loanInterestRateLowerBound),
      toFixedBN(loanInterestRateUpperBound),
    );
    debug(
      `Set ${tokenSymbol} interest rate from ${loanInterestRateLowerBound} to ${loanInterestRateUpperBound}`,
    );
  }
});
