module.exports = {
  server: {
    port: 3000
  },
  coinmarketcap: {
    sandbox: true,
    // To get a sandbox API key, signup for a sandbox account and choose the Professional Plan:
    // https://sandbox.coinmarketcap.com/signup
    apiKey: "<ADD-YOUR-API-KEY>"
  },
  infura: {
    // Go to https://infura.io/dashboard, click "VIEW PROJECT" and get the project ID.
    projectId: '<ADD-PROJECT-ID>' 
  },
  // The twelve word phrase the wallet uses to generate public/private key pairs.
  // This is needed when we deploy contracts to testnet.
  mnemonic: '<ADD-YOUR-MNEMONIC>',
  configuration: {
    tokenList: [
      { name: 'Ether', symbol: 'ETH' },
      { name: 'Dai', symbol: 'DAI' },
      { name: 'USD Coin', symbol: 'USDC' },
    ],
    collateralRatio: {
      ETH: {
        DAI: 1.50,
        USDC: 1.50
      },
      DAI: {
        ETH: 1.50,
        USDC: 1.20
      },
      USDC: {
        ETH: 1.50,
        DAI: 1.20
      }
    },
    liquidationDiscount: {
      ETH: {
        DAI: 0.05,
        USDC: 0.05
      },
      DAI: {
        ETH: 0.05,
        USDC: 0.05
      },
      USDC: {
        ETH: 0.05,
        DAI: 0.05
      }
    },
    loanInterestRate: {
      ETH: {
        1: 0.0000000004756469,
        30: 0.0000000006341958
      },
      DAI: {
        1: 0.000000003805175,
        30: 0.0000000047564688
      },
      USDC: {
        1: 0.0000000019025875,
        30: 0.0000000025367834
      }
    }
  }
}
