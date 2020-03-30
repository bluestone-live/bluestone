module.exports = {
  infura: {
    // https://infura.io/dashboard
    projectId: '24cc9d4197c643ec81bbe2ecbaa26d31',
  },
  // The twelve word phrase the wallet uses to generate public/private key pairs.
  // This is needed when we deploy contracts to testnet.
  // NOTICE: Please only set in `config/local.js`, don't share your mnemonic to anyone
  mnemonic: '<ADD-YOUR-MNEMONIC>',
  // address index in your account based by zero.
  accountIndex: 0,

  contract: {
    tokens: {
      DAI: {
        name: 'Dai',
        loanInterestRateLowerBound: 0.1,
        loanInterestRateUpperBound: 0.15,
        balanceCap: 100000,
      },
      USDT: {
        name: 'Tether',
        loanInterestRateLowerBound: 0.07,
        loanInterestRateUpperBound: 0.09,
        balanceCap: 100000,
      },
      ETH: {
        name: 'Native Ether',
        loanInterestRateLowerBound: 0.06,
        loanInterestRateUpperBound: 0.12,
        balanceCap: 100000,
      },
    },
    depositTerms: [30, 60, 90],
    loanAndCollateralTokenPairs: [
      {
        loanTokenSymbol: 'DAI',
        collateralTokenSymbol: 'ETH',
        minCollateralCoverageRatio: 1.2,
        liquidationDiscount: 0.03,
      },
      {
        loanTokenSymbol: 'USDT',
        collateralTokenSymbol: 'ETH',
        minCollateralCoverageRatio: 1.2,
        liquidationDiscount: 0.03,
      },
    ],
    protocolReserveRatio: 0.1,
    depositDistributorFeeRatio: 0.01,
    loanDistributorFeeRatio: 0.02,
    interestReserveAddress: '<ADD-ADDRESS>',
  },
};
