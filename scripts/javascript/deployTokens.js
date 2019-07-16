const debug = require('debug')('script:deployTokens')
const TokenFactory = artifacts.require('./TokenFactory.sol') 
const { makeTruffleScript } = require('./utils.js')
const { configuration } = require('../../config')

module.exports = makeTruffleScript(async () => {
  const { tokenList } = configuration
  const tokenFactory = await TokenFactory.deployed()
  let tokenAddressList = []

  for (let i = 0; i < tokenList.length; i++) {
    const { name, symbol } = tokenList[i]
    const { logs } = await tokenFactory.createToken(name, symbol)
    const address = logs
      .filter(({ event }) => event === 'TokenCreated')[0]
      .args['token']

    debug(`Deployed ${symbol} at ${address}`)
    tokenAddressList.push(address)
  }

  return tokenAddressList
})
