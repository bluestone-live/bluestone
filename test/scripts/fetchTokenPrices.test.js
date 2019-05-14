const fetchTokenPrices = require('../../scripts/fetchTokenPrices.js')
const { expect } = require('chai')

describe('script: fetchTokenPrices', () => {
  it('fetches prices for ETH, DAI and USDC', async () => {
    const tokenList = ['ETH', 'DAI', 'USDC']
    const priceList = await fetchTokenPrices(tokenList, 'USD')

    expect(priceList.length).to.equal(tokenList.length)
    priceList.forEach(price => expect(price).to.be.above(0))
  })
})
