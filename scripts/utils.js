const CoinMarketCap = require('../libs/CoinMarketCap.js')
const config = require('../config.js')

const constants = {
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000'
}

const getTokenAddress = async (tokenFactory, tokenSymbol) => {
  const tokenAddress = await tokenFactory.getToken(tokenSymbol)

  if (tokenAddress === constants.ZERO_ADDRESS) {
    throw `Token ${tokenSymbol} must be deployed first.`
  }

  console.log(`Deployed ${tokenSymbol} address: ${tokenAddress}`)

  return tokenAddress
}

const fetchTokenPrices = async (tokenList, currencyCode = 'USD') => {
  const { apiKey, sandbox } = config.coinmarketcap
  const coinMarketCap = new CoinMarketCap(apiKey, sandbox)

  const { data } = await coinMarketCap.getCryptocurrencyQuotesLatest({
    symbol: tokenList.join(','),
    convert: currencyCode
  })

  return tokenList.map(token => data[token].quote[currencyCode].price)   
}

module.exports = {
  constants,
  getTokenAddress,
  fetchTokenPrices
}
