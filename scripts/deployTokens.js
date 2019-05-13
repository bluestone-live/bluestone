const TokenFactory = artifacts.require('./TokenFactory.sol') 

const getTokenAddress = tx => {
  return tx.logs
    .filter(log => log.event === 'TokenCreated')[0]
    .args['token']
}

const deployTokens = async () => {
  const tokenFactory = await TokenFactory.deployed()
  const tokenList = [
    { name: 'Ether', symbol: 'ETH' },
    { name: 'Dai', symbol: 'DAI' },
    { name: 'USD Coin', symbol: 'USDC' },
  ]

  let tokenAddressList = []

  for (let i = 0; i < tokenList.length; i++) {
    const { name, symbol } = tokenList[i]
    const tx = await tokenFactory.createToken(name, symbol)
    const address = getTokenAddress(tx)
    console.log(`Deployed ${symbol} at ${address}`)
    tokenAddressList.push(address)
  }

  return tokenAddressList
}

module.exports = async (callback = () => {}) => {
  try {
    const tokenAddresses = await deployTokens()
    callback()
    return tokenAddresses
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
