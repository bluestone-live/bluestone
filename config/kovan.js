module.exports = {
  contract: {
    tokens: {
      DAI: {
        name: 'Dai',
        loanInterestRateLowerBound: 0.1,
        loanInterestRateUpperBound: 0.15,
      },
      USDT: {
        name: 'Tether',
        loanInterestRateLowerBound: 0.07,
        loanInterestRateUpperBound: 0.09,
      },
      ETH: {
        name: 'Native Ether',
        loanInterestRateLowerBound: 0.06,
        loanInterestRateUpperBound: 0.12,
      },
    },
    depositTerms: [30, 60, 90],
    loanAndCollateralTokenPairs: [
      {
        loanTokenSymbol: 'DAI',
        collateralTokenSymbol: 'ETH',
        minCollateralCoverageRatio: 1.5,
        liquidationDiscount: 0.03,
      },
      {
        loanTokenSymbol: 'USDT',
        collateralTokenSymbol: 'ETH',
        minCollateralCoverageRatio: 1.5,
        liquidationDiscount: 0.03,
      },
      {
        loanTokenSymbol: 'USDT',
        collateralTokenSymbol: 'DAI',
        minCollateralCoverageRatio: 1.5,
        liquidationDiscount: 0.03,
      },
    ],
    protocolReserveRatio: 0.07,
    depositDistributorFeeRatio: 0.01,
    loanDistributorFeeRatio: 0.02,
    interestReserveAddress: '0xF78237d7aE69c0C2A6e85431341b87d689F29dFF',
  },
};
