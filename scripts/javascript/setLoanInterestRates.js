const LinearInterestRateModel = artifacts.require('LinearInterestRateModel');
const MappingInterestRateModel = artifacts.require('MappingInterestRateModel');
const debug = require('debug')('script:setLoanInterestRates');
const { loadNetwork, makeTruffleScript, toFixedBN } = require('../utils.js');
const config = require('config');
const { BN } = require('@openzeppelin/test-helpers');

module.exports = makeTruffleScript(async (network) => {
  const { contracts, tokens } = loadNetwork(network);
  const tokenSymbolList = Object.keys(tokens);
  const modelSelect = config.get('contract.interestRateModel.select');

  debug('Set loan interest rates');
  if (modelSelect === 'Linear') {
    debug('Set Linear Interest Rate Model');
    const interestRateModel = await LinearInterestRateModel.at(
      contracts.LinearInterestRateModel,
    );
    await Promise.all(
      tokenSymbolList.map(async (tokenSymbol) => {
        const { address } = tokens[tokenSymbol];

        const { loanInterestRateLowerBound, loanInterestRateUpperBound } =
          config.get(`contract.tokens.${tokenSymbol}`);

        if (loanInterestRateLowerBound && loanInterestRateUpperBound) {
          await interestRateModel.setLoanParameters(
            address,
            toFixedBN(loanInterestRateLowerBound),
            toFixedBN(loanInterestRateUpperBound),
          );
          debug(
            `Set ${tokenSymbol} interest rate from ${loanInterestRateLowerBound} to ${loanInterestRateUpperBound}`,
          );
        }
      }),
    );
  } else if (modelSelect === 'Mapping') {
    debug('Set Mapping Interest Rate Model');
    const interestRateModel = await MappingInterestRateModel.at(
      contracts.MappingInterestRateModel,
    );

    await Promise.all(
      tokenSymbolList.map(async (tokenSymbol) => {
        const { address } = tokens[tokenSymbol];

        const { termList, interestRateList } = config.get(
          `contract.tokens.${tokenSymbol}`,
        );

        if (termList && interestRateList) {
          const termBigNumberList = termList.map((term) => new BN(term));
          const interestRateBigNumberList = interestRateList.map(
            (interestRate) => toFixedBN(interestRate),
          );

          await interestRateModel.setRates(
            address,
            termBigNumberList,
            interestRateBigNumberList,
          );
          debug(
            `set ${tokenSymbol} interest rates succeed: ${termList} => ${interestRateList}`,
          );
        }
      }),
    );
  } else {
    return debug('InterestRateModel set error in network file');
  }
});
