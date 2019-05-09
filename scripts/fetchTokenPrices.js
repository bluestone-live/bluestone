const CoinMarketCap = require('../services/CoinMarketCap.js')
const config = require('config')

const apiKey = config.get('coinmarketcap.apiKey')
const sandbox = config.get('coinmarketcap.sandbox')
const coinMarketCap = new CoinMarketCap(apiKey, sandbox)

const fetchTokenPrices = async (tokenList, currencyCode = 'USD') => {
  const { data } = await coinMarketCap.getCryptocurrencyQuotesLatest({
    symbol: tokenList.join(','),
    convert: currencyCode
  })

  return tokenList.map(token => data[token].quote[currencyCode].price)   
}

module.exports = fetchTokenPrices
