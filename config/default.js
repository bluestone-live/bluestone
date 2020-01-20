module.exports = {
  server: {
    port: 3000,
  },
  coinmarketcap: {
    sandbox: true,
    // To get a sandbox API key, signup for a sandbox account and choose the Professional Plan:
    // https://sandbox.coinmarketcap.com/signup
    apiKey: '<ADD-YOUR-API-KEY>',
  },
  cryptocompare: {
    // Get a free key here: https://min-api.cryptocompare.com/pricing
    apiKey: '<ADD-YOUR-API-KEY>',
  },
  infura: {
    // Go to https://infura.io/dashboard, click "VIEW PROJECT" and get the project ID.
    projectId: '<ADD-PROJECT-ID>',
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
    maxDepositDistributorFeeRatio: 0.01,
    maxLoanDistributorFeeRatio: 0.02,
    protocolAddress: '<ADD-ADDRESS>',
  },
};
