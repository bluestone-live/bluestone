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
  infura: {
    // Go to https://infura.io/dashboard, click "VIEW PROJECT" and get the project ID.
    projectId: '<ADD-PROJECT-ID>',
  },
  // The twelve word phrase the wallet uses to generate public/private key pairs.
  // This is needed when we deploy contracts to testnet.
  mnemonic: '<ADD-YOUR-MNEMONIC>',
  // address index in your account based by zero.
  accountIndex: 0,
  configuration: {
    tokens: {
      // TODO: remove ETH once we have ETH <=> WETH conversion ready
      ETH: { name: 'Ether', symbol: 'ETH' },
      DAI: { name: 'Dai', symbol: 'DAI' },
      USDT: { name: 'Tether', symbol: 'USDT' },
      WETH: { name: 'Wrapped Ether', symbol: 'WETH' },
    },
    depositTerms: [30],
    loanTerms: [7, 30],
    collateralRatio: {
      ETH: {
        DAI: 1.5,
        USDT: 1.5,
      },
      DAI: {
        ETH: 1.5,
        USDT: 1.2,
      },
      USDT: {
        ETH: 1.5,
        DAI: 1.2,
      },
    },
    liquidationDiscount: {
      ETH: {
        DAI: 0.05,
        USDT: 0.05,
      },
      DAI: {
        ETH: 0.05,
        USDT: 0.05,
      },
      USDT: {
        ETH: 0.05,
        DAI: 0.05,
      },
    },
    loanInterestRate: {
      ETH: {
        7: 0.04,
        30: 0.02,
      },
      DAI: {
        7: 0.17,
        30: 0.15,
      },
      USDT: {
        7: 0.13,
        30: 0.1,
      },
    },
  },
};
