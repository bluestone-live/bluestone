const { toFixedBN } = require('../utils/index');

/**
 *
 * @param {string[]} accounts Accounts
 * @param {Contract} protocol Protocol instance
 * @param {Contract} interestRateModel InterestRateModel instance
 * @param {number[]} depositTerms deposit terms
 * @param {string[]} depositTokens deposit token addresses
 * @param {string[]} loanTokens loan token address
 * @param {Array<{loanTokenAddress: string, collateralTokenAddress: string, minCollateralCoverageRatio: number, liquidationDiscount: number}>} loanPairs loan pairs
 * @param {number[]} loanInterestRateLowerBounds loan interest rate lower bound for each loan token
 * @param {number[]} loanInterestRateUpperBounds loan interest rate upper bound for each loan token
 * @param {number} protocolReserveRatio protocol reserve ratio
 * @param {number} depositDistributorFeeRatio max deposit distributor fee ratio
 * @param {number} loanDistributorFeeRatio max loan distributor fee ratio
 */
const setupTestEnv = async (
  [
    owner,
    keeper,
    depositor,
    loaner,
    depositDistributor,
    loanDistributor,
    interestReserveAddress,
  ],
  protocol,
  interestRateModel,
  depositTerms,
  depositTokens,
  loanTokens,
  loanPairs,
  loanInterestRateLowerBounds,
  loanInterestRateUpperBounds,
  protocolReserveRatio,
  depositDistributorFeeRatio,
  loanDistributorFeeRatio,
  whitelistedKeepers = [],
  whitelistedDepositors = [],
  whitelistedLoaners = [],
  balanceCap = toFixedBN(100000),
) => {
  // Enable deposit terms
  await protocol.enableDepositTerms(depositTerms);

  for (depositToken of depositTokens) {
    await protocol.enableDepositToken(depositToken.address);
    await protocol.setBalanceCap(depositToken.address, balanceCap);
  }

  // Enable loan pair
  for (let i = 0; i < loanPairs.length; i++) {
    const loanPair = loanPairs[i];
    await protocol.setLoanAndCollateralTokenPair(
      loanPair.loanTokenAddress,
      loanPair.collateralTokenAddress,
      toFixedBN(loanPair.minCollateralCoverageRatio),
      toFixedBN(loanPair.liquidationDiscount),
    );
  }

  for (let i = 0; i < loanTokens.length; i++) {
    const loanToken = loanTokens[i];

    // Set loan interest rate
    await interestRateModel.setLoanParameters(
      loanToken.address,
      toFixedBN(loanInterestRateLowerBounds[i]),
      toFixedBN(loanInterestRateUpperBounds[i]),
    );
  }
  // Set InterestRateModel address
  await protocol.setInterestRateModel(interestRateModel.address);

  // Set interest reserve address
  await protocol.setInterestReserveAddress(interestReserveAddress);

  // Set protocol reserve ratio
  await protocol.setProtocolReserveRatio(toFixedBN(protocolReserveRatio));

  // Set max distributor fee ratios
  if (depositDistributorFeeRatio && loanDistributorFeeRatio) {
    await protocol.setMaxDistributorFeeRatios(
      toFixedBN(depositDistributorFeeRatio),
      toFixedBN(loanDistributorFeeRatio),
    );
  }

  // Add whitelisted accounts
  if (whitelistedKeepers && whitelistedKeepers.length > 0) {
    for (const account of whitelistedKeepers) {
      await protocol.addKeeperWhitelisted(account);
    }
  }
  if (whitelistedDepositors && whitelistedDepositors.length > 0) {
    for (const account of whitelistedDepositors) {
      await protocol.addLenderWhitelisted(account);
    }
  }
  if (whitelistedLoaners && whitelistedLoaners.length > 0) {
    for (const account of whitelistedLoaners) {
      await protocol.addBorrowerWhitelisted(account);
    }
  }
};

module.exports = {
  setupTestEnv,
};
