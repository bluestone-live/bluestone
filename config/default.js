module.exports = {
  infura: {
    // https://infura.io/dashboard
    projectId: '24cc9d4197c643ec81bbe2ecbaa26d31',
  },
  // The twelve word phrase the wallet uses to generate public/private key pairs.
  // This is needed when we deploy contracts to testnet or mainnet.
  // NOTICE: Please only set in `config/local.js`, don't share your mnemonic to anyone
  mnemonic: '<ADD-YOUR-MNEMONIC>',
  // address index in your account based by zero.
  accountIndex: 0,

  contract: {
    tokens: {
      USDT: {
        name: 'Tether',
        loanInterestRateLowerBound: 0.08,
        loanInterestRateUpperBound: 0.1,
        balanceCap: 1000000,
      },
      WETH: {
        name: 'Wrapped Ether',
        loanInterestRateLowerBound: 0.06,
        loanInterestRateUpperBound: 0.08,
        balanceCap: 10000,
      },
    },
    depositTerms: [30, 60, 90],
    loanAndCollateralTokenPairs: [
      {
        loanTokenSymbol: 'USDT',
        collateralTokenSymbol: 'WETH',
        minCollateralCoverageRatio: 1.3,
        liquidationDiscount: 0.05,
      },
    ],
    protocolReserveRatio: 0,
    depositDistributorFeeRatio: 0.05,
    loanDistributorFeeRatio: 0.05,
    interestReserveAddress: '<ADD-ADDRESS>',
  },
};
