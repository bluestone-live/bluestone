const debug = require('debug')('script:deployTokens')
const TokenFactory = artifacts.require('./TokenFactory.sol') 
const { makeTruffleScript } = require('./utils.js')

const getTokenAddress = tx => {
  return tx.logs
    .filter(log => log.event === 'TokenCreated')[0]
    .args['token']
}

module.exports = makeTruffleScript(async () => {
  const tokenList = [
    { name: 'Ether', symbol: 'ETH' },
    { name: 'Dai', symbol: 'DAI' },
    { name: 'USD Coin', symbol: 'USDC' },
  ]

  const tokenFactory = await TokenFactory.deployed()
  let tokenAddressList = []

  for (let i = 0; i < tokenList.length; i++) {
    const { name, symbol } = tokenList[i]
    const tx = await tokenFactory.createToken(name, symbol)
    const address = getTokenAddress(tx)
    debug(`Deployed ${symbol} at ${address}`)
    tokenAddressList.push(address)
  }

  return tokenAddressList
})
