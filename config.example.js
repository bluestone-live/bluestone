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
        1: 0.03,
        7: 0.04,
        30: 0.05
      },
      DAI: {
        1: 0.03,
        7: 0.04,
        30: 0.05
      },
      USDC: {
        1: 0.03,
        7: 0.04,
        30: 0.05
      }
    }
  }
}
