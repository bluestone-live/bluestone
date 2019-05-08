const rp = require('request-promise')

/**
 * Wrapper for CoinMarketCap API.
 * Documentation: https://coinmarketcap.com/api/documentation/v1/
 */
class CoinMarketCap {
  constructor(apiKey, sandbox = true) {
    this.apiKey = apiKey
    this.baseURL = `https://${sandbox ? 'sandbox' : 'pro'}-api.coinmarketcap.com/v1`
  }

  async request(url, options) {
    const requestOptions = Object.assign({
      uri: this.baseURL + url,
      headers: {
        'X-CMC_PRO_API_KEY': this.apiKey
      },
      json: true,
      gzip: true
    }, options)

    return await rp(requestOptions)
  }

  async getCryptocurrencyQuotesLatest(params) {
    return await this.request('/cryptocurrency/quotes/latest', { qs: params })
  }
}

module.exports = CoinMarketCap
