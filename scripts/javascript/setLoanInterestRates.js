const debug = require('debug')('script:setLoanInterestRate');
const InterestModel = artifacts.require('./InterestModel.sol');
const { loadNetwork, makeTruffleScript, toFixedBN } = require('../utils.js');
const config = require('config');

module.exports = makeTruffleScript(async (network) => {
  const { contracts, tokens } = loadNetwork(network);
  const tokenSymbolList = Object.keys(tokens);

  const interestModel = await InterestModel.at(contracts.InterestModel);

  debug('Set loan interest rates');
  await Promise.all(
    tokenSymbolList.map(async (tokenSymbol) => {
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
    }),
  );
});
