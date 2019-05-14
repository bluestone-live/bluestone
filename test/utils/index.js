const { BN, time } = require('openzeppelin-test-helpers')

const printLogs = logs => {
  logs.forEach(({event, args}) => {
    console.log('---')
    console.log(`Event: ${event}`)
    Object.keys(args)
      .filter(key => key !== '0' && key !== '__length__')
      .forEach(key => console.log(`Arg: ${key}, Value: ${args[key]}`))
  })
}

/** 
 * Convert number to BigNumber with specified significant. 
 * toFixedBN(100) -> 100e18
 * toFixedBN(1.5) -> 15e17
 * toFixed(0.03) -> 3e16
 * toFixed(5, 16) -> 5e16
 */
function toFixedBN(num, significant = 18) {
  let decimalPlaces = (num.toString().split('.')[1] || []).length

  if (decimalPlaces === 0) {
    return new BN(num).mul(new BN(10).pow(new BN(significant)))
  } else {
    const integer = num * Math.pow(10, decimalPlaces)
    return new BN(integer).mul(new BN(10).pow(new BN(significant - decimalPlaces)))
  }
}

const createERC20Token = async (owner, initialSupply = toFixedBN(1000), name = 'NewToken', symbol = 'NT') => {
  const TokenFactory = artifacts.require('./TokenFactory.sol') 
  const ERC20Mock = artifacts.require('./ERC20Mock.sol') 

  const tokenFactory = await TokenFactory.deployed()
  const tx = await tokenFactory.createToken(name, symbol, owner, initialSupply)
  const tokenAddress = tx.logs
    .filter(log => log.event === 'TokenCreated')[0]
    .args['token']
  return ERC20Mock.at(tokenAddress)
}

module.exports = {
  printLogs,
  createERC20Token,
  toFixedBN
}
