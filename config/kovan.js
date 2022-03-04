module.exports = {
  contract: {
    tokens: {
      DAI: {
        name: 'Dai',
        loanInterestRateLowerBound: 0.12,
        loanInterestRateUpperBound: 0.12,
        balanceCap: 1000000,
      },
      USDT: {
        name: 'Tether',
        loanInterestRateLowerBound: 0.12,
        loanInterestRateUpperBound: 0.12,
        balanceCap: 1000000,
      },
      ETH: {
        name: 'Native Ether',
        loanInterestRateLowerBound: 0.12,
        loanInterestRateUpperBound: 0.12,
        balanceCap: 10000,
      },
      USDC: {
        name: 'USDC',
        loanInterestRateLowerBound: 0.12,
        loanInterestRateUpperBound: 0.12,
        balanceCap: 1000000,
      },
    },
    depositTerms: [1, 180, 365],
    loanAndCollateralTokenPairs: [
      {
        loanTokenSymbol: 'DAI',
        collateralTokenSymbol: 'ETH',
        minCollateralCoverageRatio: 1.3,
        liquidationDiscount: 0.05,
      },
      {
        loanTokenSymbol: 'USDT',
        collateralTokenSymbol: 'ETH',
        minCollateralCoverageRatio: 1.3,
        liquidationDiscount: 0.05,
      },
      {
        loanTokenSymbol: 'USDC',
        collateralTokenSymbol: 'ETH',
        minCollateralCoverageRatio: 1.3,
        liquidationDiscount: 0.05,
      },
    ],
    protocolReserveRatio: 0,
    depositDistributorFeeRatio: 0,
    loanDistributorFeeRatio: 0,
    interestReserveAddress: '0xf4Cb4Decc09CAdA4e4DCd510d915A5d9E5C8DE71',
  },
};
