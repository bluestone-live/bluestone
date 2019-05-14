const CoinMarketCap = require('../../libs/CoinMarketCap.js')
const config = require('../../config.js')
const { expect } = require('chai')

const { apiKey, sandbox } = config.coinmarketcap
let coinMarketCap = new CoinMarketCap(apiKey, sandbox)

describe('#getCryptocurrencyQuotesLatest', () => {
  it('gets prices for ETH, DAI and USDC', async () => {
    const res = await coinMarketCap.getCryptocurrencyQuotesLatest({
      symbol: 'ETH,DAI,USDC',
      convert: 'USD'
    })

    expect(res).to.have.property('status')
    expect(res).to.have.nested.property('data.ETH')
    expect(res).to.have.nested.property('data.DAI')
    expect(res).to.have.nested.property('data.USDC')
  })
})
