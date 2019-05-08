const CoinMarketCap = require('./CoinMarketCap.js')
const config = require('config')

const apiKey = config.get('coinmarketcap.apiKey')
const sandbox = config.get('coinmarketcap.sandbox')

let coinMarketCap = new CoinMarketCap(apiKey, sandbox)

test('#getCryptocurrencyQuotesLatest', async () => {
  const res = await coinMarketCap.getCryptocurrencyQuotesLatest({
    symbol: 'ETH,DAI,USDC',
    convert: 'USD'
  })

  expect(res).toHaveProperty('status')
  expect(res).toHaveProperty('data.ETH')
  expect(res).toHaveProperty('data.DAI')
  expect(res).toHaveProperty('data.USDC')
})
