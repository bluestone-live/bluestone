const { toFixedBN } = require('../utils/index');

/**
 *
 * @param {string[]} accounts Accounts
 * @param {Contract} protocol Protocol instance
 * @param {Contract} interestModel InterestModel instance
 * @param {number[]} depositTerms deposit terms
 * @param {string[]} depositTokens deposit token addresses
 * @param {string[]} loanTokens loan token address
 * @param {Array<{loanTokenAddress: string, collateralTokenAddress: string}>} loanPairs loan pairs
 * @param {number[]} minCollateralCoverageRatios min collateral coverage ratio for each loan pair
 * @param {number[]} liquidationDiscounts liquidation discount for each loan token
 * @param {number[]} loanInterestRateLowerBounds loan interest rate lower bound for each loan token
 * @param {number[]} loanInterestRateUpperBounds loan interest rate upper bound for each loan token
 * @param {number} protocolReserveRatio protocol reserve ratio
 * @param {number} maxDepositDistributorFeeRatio max deposit distributor fee ratio
 * @param {number} maxLoanDistributorFeeRatio max loan distributor fee ratio
 */
const setupTestEnv = async (
  [
    owner,
    depositor,
    loaner,
    depositDistributor,
    loanDistributor,
    protocolAddress,
  ],
  protocol,
  interestModel,
  depositTerms,
  depositTokens,
  loanTokens,
  loanPairs,
  // minCollateralCoverageRatios,
  // liquidationDiscounts,
  loanInterestRateLowerBounds,
  loanInterestRateUpperBounds,
  protocolReserveRatio,
  maxDepositDistributorFeeRatio,
  maxLoanDistributorFeeRatio,
) => {
  // Enable deposit terms
  for (term of depositTerms) {
    await protocol.enableDepositTerm(term);
  }

  // Enable deposit tokens
  for (depositToken of depositTokens) {
    await protocol.enableDepositToken(depositToken.address);
  }

  // Enable loan pair
  for (let i = 0; i < loanPairs.length; i++) {
    const loanPair = loanPairs[i];
    await protocol.setLoanAndCollateralTokenPair(
      loanPair.loanTokenAddress,
      loanPair.collateralTokenAddress,
      loanPair.minCollateralCoverageRatio,
      loanPair.liquidationDiscount,
    );
  }

  for (let i = 0; i < loanTokens.length; i++) {
    const loanToken = loanTokens[i];

    // Set loan interest rate
    await interestModel.setLoanParameters(
      loanToken.address,
      toFixedBN(loanInterestRateLowerBounds[i]),
      toFixedBN(loanInterestRateUpperBounds[i]),
    );
  }
  // Set InterestModel address
  await protocol.setInterestModel(interestModel.address);

  // Set protocol address
  await protocol.setProtocolAddress(protocolAddress);

  // Set protocol reserve ratio
  await protocol.setProtocolReserveRatio(toFixedBN(protocolReserveRatio));

  // Set max distributor fee ratios
  await protocol.setMaxDistributorFeeRatios(
    toFixedBN(maxDepositDistributorFeeRatio),
    toFixedBN(maxLoanDistributorFeeRatio),
  );
};

module.exports = {
  setupTestEnv,
};
