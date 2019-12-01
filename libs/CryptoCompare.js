const rp = require('request-promise');

/**
 * Wrapper for CryptoCompare API.
 * Documentation: https://min-api.cryptocompare.com/documentation
 */
class CryptoCompare {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://min-api.cryptocompare.com/data';
  }

  async request(url, options) {
    const requestOptions = Object.assign(
      {
        uri: this.baseURL + url,
        headers: {
          authorization: this.apiKey,
        },
        json: true,
        gzip: true,
      },
      options,
    );

    return await rp(requestOptions);
  }

  async getSingleSymbolPrice(params) {
    return await this.request('/price', { qs: params });
  }

  async getMultipleSymbolsPrice(params) {
    return await this.request('/pricemulti', { qs: params });
  }
}

module.exports = CryptoCompare;
