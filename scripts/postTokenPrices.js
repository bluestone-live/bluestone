const PriceOracle = artifacts.require('./PriceOracle.sol')
const fetchTokenPrices = require('./fetchTokenPrices.js')

/**
 * Given a list of tokens, each with name and deployed address, 
 * this script does the following:
 * 1. Fetch the latest token price in USD
 * 2. Scale the price by 10**18 and convert to BN instance
 * 3. Post the price to PriceOracle contract
 */
module.exports = async tokenList => {
  const tokenNameList = tokenList.map(token => token.name)
  const tokenAddressList = tokenList.map(token => token.address)

  console.log(`Fetching prices for tokens: ${tokenNameList}`)
  const priceList = await fetchTokenPrices(tokenNameList, 'USD')
  console.log(`Returned prices in USD: ${priceList}`)

  const scaledPriceList = priceList
    .map(decimal => decimal * Math.pow(10, 18))
    .map(web3.utils.toBN)

  const priceOracle = await PriceOracle.deployed()

  console.log('Posting prices to oracle...')
  await priceOracle.setPrices(tokenAddressList, scaledPriceList)
  console.log('Done.')

  return scaledPriceList
}
