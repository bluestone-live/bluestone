const debug = require('debug')('script:mintTokens')
const ERC20Mock = artifacts.require('./ERC20Mock.sol')
const { makeTruffleScript, getTokenAddress } = require('./utils.js')

module.exports = makeTruffleScript(async (_, tokenSymbol, accountAddress, decimalValue) => {
  const tokenAddress = await getTokenAddress(tokenSymbol)
  const token = await ERC20Mock.at(tokenAddress)
  const scaledValue = web3.utils.toBN(decimalValue * Math.pow(10, 18))

  debug(`Token symbol: ${tokenSymbol}`)
  debug(`Account address: ${accountAddress}`)
  debug(`Token amount in wei: ${scaledValue}`)

  await token.mint(accountAddress, scaledValue)
})
