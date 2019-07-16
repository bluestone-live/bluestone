const CoinMarketCap = require('../../libs/CoinMarketCap.js')
const config = require('../../config.js')
const { expect } = require('chai')

describe('lib: CoinMarketCap', function() {
  this.retries(2)

  const { apiKey, sandbox } = config.coinmarketcap
  const coinMarketCap = new CoinMarketCap(apiKey, sandbox)

  describe('#getCryptocurrencyQuotesLatest', () => {
    it('gets prices for ETH, DAI and USDT', async () => {
      const res = await coinMarketCap.getCryptocurrencyQuotesLatest({
        symbol: 'ETH,DAI,USDT',
        convert: 'USD'
      })

      expect(res).to.have.property('status')
      expect(res).to.have.nested.property('data.ETH')
      expect(res).to.have.nested.property('data.DAI')
      expect(res).to.have.nested.property('data.USDT')
    })
  })
})
