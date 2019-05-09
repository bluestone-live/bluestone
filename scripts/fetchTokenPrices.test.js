const fetchTokenPrices = require('./fetchTokenPrices.js')

test('fetch prices for ETH, DAI and USDC', async () => {
  const tokenList = ['ETH', 'DAI', 'USDC']
  const priceList = await fetchTokenPrices(tokenList, 'USD')

  expect(priceList).toHaveLength(tokenList.length)
  priceList.forEach(price => expect(price).toBeGreaterThan(0))
})
