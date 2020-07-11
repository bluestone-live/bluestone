module.exports = {
  contract: {
    tokens: {
      DAI: {
        name: 'Dai',
        loanInterestRateLowerBound: 0.03,
        loanInterestRateUpperBound: 0.04,
        balanceCap: 1000,
      },
      ETH: {
        name: 'Native Ether',
        loanInterestRateLowerBound: 0.03,
        loanInterestRateUpperBound: 0.04,
        balanceCap: 1000,
      },
    },
    depositTerms: [1, 2, 3, 4, 5, 6, 7],
    loanAndCollateralTokenPairs: [
      {
        loanTokenSymbol: 'DAI',
        collateralTokenSymbol: 'ETH',
        minCollateralCoverageRatio: 1.5,
        liquidationDiscount: 0.03,
      },
    ],
    protocolReserveRatio: 0.07,
    depositDistributorFeeRatio: 0.01,
    loanDistributorFeeRatio: 0.02,
    interestReserveAddress: '0x2c46b8c77ddc40B34b24dF36eeDE9356aa814AEd',
  },
};
