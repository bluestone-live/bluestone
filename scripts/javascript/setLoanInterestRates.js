const debug = require('debug')('script:setLoanInterestRate');
const InterestModel = artifacts.require('./InterestModel.sol');
const { loadNetwork, makeTruffleScript, toFixedBN } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async network => {
  const { tokens } = loadNetwork(network);
  const tokenSymbolList = Object.keys(tokens);

  const interestModel = await InterestModel.deployed();

  debug('Set loan interest rates');
  for (tokenSymbol of tokenSymbolList) {
    const { address } = tokens[tokenSymbol];

    const {
      loanInterestRateLowerBound,
      loanInterestRateUpperBound,
    } = config.get(`contract.tokens.${tokenSymbol}`);

    await interestModel.setLoanParameters(
      address,
      toFixedBN(loanInterestRateLowerBound),
      toFixedBN(loanInterestRateUpperBound),
    );
    debug(
      `Set ${tokenSymbol} interest rate from ${loanInterestRateLowerBound} to ${loanInterestRateUpperBound}`,
    );
  }
});
