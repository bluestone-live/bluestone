const _debug = require('debug')('script:utils')
const CoinMarketCap = require('../../libs/CoinMarketCap.js')
const config = require('../../config.js')

const constants = {
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000'
}

const getTokenAddress = async (tokenFactory, tokenSymbol) => {
  const debug = _debug.extend('getTokenAddress')
  const tokenAddress = await tokenFactory.getToken(tokenSymbol)

  if (tokenAddress === constants.ZERO_ADDRESS) {
    throw `Token ${tokenSymbol} must be deployed first.`
  }

  debug(`Got deployed ${tokenSymbol} address: ${tokenAddress}`)

  return tokenAddress
}

const fetchTokenPrices = async (tokenList, currencyCode = 'USD') => {
  const debug = _debug.extend('fetchTokenPrices')
  const { apiKey, sandbox } = config.coinmarketcap
  const coinMarketCap = new CoinMarketCap(apiKey, sandbox)

  debug('Fetching prices for tokens: %o', tokenList)
  const { data } = await coinMarketCap.getCryptocurrencyQuotesLatest({
    symbol: tokenList.join(','),
    convert: currencyCode
  })

  const priceList = tokenList
    .map(token => data[token].quote[currencyCode].price)   
    .map(price => price.toFixed(2))
    .map(price => Number(price))

  debug('Got token prices in %s: %o', currencyCode, priceList)
  return priceList
}

// This function reduces boilerplates code we need to write external scripts
// for truffle and outputs useful debugging info. It accepts a function that 
// contains main scripting logic and returns another function to be 
// executed by truffle.
const makeTruffleScript = (fn) => {
  const debug = _debug.extend('makeTruffleScript')

  // The following function will be executed by truffle, the first argument
  // must be a callback function according to the doc:
  // https://truffleframework.com/docs/truffle/getting-started/writing-external-scripts
  return async (callback = () => {}, ...testArgs) => {
    const isInvokedFromCmd = process.argv[2] === 'exec'

    let args

    if (isInvokedFromCmd) {
      // Get script name from full path
      const scriptName = process.argv[4].replace(/^.*[\\\/]/, '')
      debug('Script name: %s', scriptName)

      // Get arguments from command line
      args = process.argv.slice(5)
    } else {
      // Get arguments from test suite
      args = testArgs
    }

    debug('Received arguments: %o', args)

    try {
      debug('Executing...')
      const res = await fn(...args)
      debug('Done!')
      callback()
      return res ? res : true
    } catch (err) {
      debug(err)
      callback()
      return false
    }
  }
}

module.exports = {
  constants,
  getTokenAddress,
  fetchTokenPrices,
  makeTruffleScript
}
