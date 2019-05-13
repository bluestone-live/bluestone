const PriceOracle = artifacts.require('./PriceOracle.sol')
const TokenFactory = artifacts.require('./TokenFactory.sol')
const fetchTokenPrices = require('./fetchTokenPrices.js')
const { constants } = require('openzeppelin-test-helpers')

/**
 * Given a list of tokens, each with name and deployed address, 
 * this script does the following:
 * 1. Fetch the latest token price in USD
 * 2. Scale the price by 10**18 and convert to BN instance
 * 3. Post the price to PriceOracle contract
 */
const postTokenPrices = async tokenSymbolList => {
  const tokenFactory = await TokenFactory.deployed()
  let tokenAddressList = []

  for (let i = 0; i < tokenSymbolList.length; i++) {
    const symbol = tokenSymbolList[i]
    const address = await tokenFactory.getToken(symbol)

    if (address === constants.ZERO_ADDRESS) {
      throw 'Make sure you have tokens deployed. Did you forget to run script deployTokens?'
    } else {
      tokenAddressList.push(address)
    }
  }

  console.log(`Fetching prices for tokens: ${tokenSymbolList}`)
  const priceList = await fetchTokenPrices(tokenSymbolList, 'USD')
  console.log(`Returned prices in USD: ${priceList}`)

  const scaledPriceList = priceList
    .map(decimal => decimal * Math.pow(10, 18))
    .map(web3.utils.toBN)

  const priceOracle = await PriceOracle.deployed()

  console.log('Posting prices to oracle...')
  console.log(`Token list: ${tokenSymbolList}`)
  console.log(`Token addresses: ${tokenAddressList}`)
  console.log(`Token scaled prices: ${scaledPriceList}`)
  await priceOracle.setPrices(tokenAddressList, scaledPriceList)
  console.log('Done.')

  return scaledPriceList
}

module.exports = async (callback = () => {}) => {
  const tokenSymbolList = ['ETH', 'DAI', 'USDC']

  try {
    const tokenPriceList = await postTokenPrices(tokenSymbolList)
    callback()
    return tokenPriceList
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
