module.exports = {
  infura: {
    // https://infura.io/dashboard
    // projectId: '24cc9d4197c643ec81bbe2ecbaa26d31',
    projectId: '76eca7933f9a4b73a2438632bfd0180b',
  },
  // The twelve word phrase the wallet uses to generate public/private key pairs.
  // This is needed when we deploy contracts to testnet or mainnet.
  // NOTICE: Please only set in `config/local.js`, don't share your mnemonic to anyone
  mnemonic: '<ADD-YOUR-MNEMONIC>',
  // address index in your account based by zero.
  accountIndex: 0,

  contract: {
    tokens: {
      ETH: {
        name: 'Native Ether',
        loanInterestRateLowerBound: 0.12,
        loanInterestRateUpperBound: 0.12,
        balanceCap: 10000,
      },
      SGC: {
        name: 'SGC',
        loanInterestRateLowerBound: 0.12,
        loanInterestRateUpperBound: 0.12,
        balanceCap: 1000000,
      },
      xBTC: {
        name: 'xBTC',
        loanInterestRateLowerBound: 0.12,
        loanInterestRateUpperBound: 0.12,
        balanceCap: 10000,
      },
    },
    depositTerms: Array.from({ length: 365 }, (_, i) => i + 1),
    loanAndCollateralTokenPairs: [
      {
        loanTokenSymbol: 'SGC',
        collateralTokenSymbol: 'ETH',
        minCollateralCoverageRatio: 1.5,
        liquidationDiscount: 0.05,
      },
      {
        loanTokenSymbol: 'SGC',
        collateralTokenSymbol: 'xBTC',
        minCollateralCoverageRatio: 1.5,
        liquidationDiscount: 0.05,
      },
    ],
    protocolReserveRatio: 0,
    depositDistributorFeeRatio: 0,
    loanDistributorFeeRatio: 0,
    interestReserveAddress: '0xf4Cb4Decc09CAdA4e4DCd510d915A5d9E5C8DE71',
  },
};
