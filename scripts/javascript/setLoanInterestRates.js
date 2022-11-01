const debug = require('debug')('script:setLoanInterestRates');
const { loadNetwork, makeTruffleScript, toFixedBN } = require('../utils.js');
const config = require('config');
const { BN } = require('@openzeppelin/test-helpers');

module.exports = makeTruffleScript(async (network) => {
  const { contracts, tokens } = loadNetwork(network);
  const tokenSymbolList = Object.keys(tokens);

  debug('Set loan interest rates');
  if (contracts.InterestRateModel === contracts.LinearInterestRateModel) {
    debug('Set Linear Interest Rate Model');
    const InterestRateModel = artifacts.require('LinearInterestRateModel');
    const interestRateModel = await InterestRateModel.at(
      contracts.InterestRateModel,
    );
    await Promise.all(
      tokenSymbolList.map(async (tokenSymbol) => {
        const { address } = tokens[tokenSymbol];

        const { loanInterestRateLowerBound, loanInterestRateUpperBound } =
          config.get(`contract.tokens.${tokenSymbol}`);

        await interestRateModel.setLoanParameters(
          address,
          toFixedBN(loanInterestRateLowerBound),
          toFixedBN(loanInterestRateUpperBound),
        );
        debug(
          `Set ${tokenSymbol} interest rate from ${loanInterestRateLowerBound} to ${loanInterestRateUpperBound}`,
        );
      }),
    );
  } else if (
    contracts.InterestRateModel === contracts.MappingInterestRateModel
  ) {
    debug('Set Mapping Interest Rate Model');
    const InterestRateModel = artifacts.require('MappingInterestRateModel');
    const interestRateModel = await InterestRateModel.at(
      contracts.InterestRateModel,
    );

    tokenSymbolList.map(async (tokenSymbol) => {
      const { address } = tokens[tokenSymbol];

      const { termList, interestRateList } = config.get(
        `contract.tokens.${tokenSymbol}`,
      );
      const termBigNumberList = termList.map((term) => new BN(term));
      const interestRateBigNumberList = interestRateList.map((interestRate) =>
        toFixedBN(interestRate),
      );

      await interestRateModel.setLoanParameters(
        address,
        termBigNumberList,
        interestRateBigNumberList,
      );
      debug(`set LoanParameters: ${termList} => ${interestRateList}`);
    });
  } else {
    return debug('InterestRateModel set error in network file');
  }
});
