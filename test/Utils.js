const { BN } = require('openzeppelin-test-helpers')

const createERC20Token = async (initialHolder, initialSupply = new BN(100)) => {
  const ERC20Mock = artifacts.require('ERC20Mock')
  const token = await ERC20Mock.new(initialHolder, initialSupply)
  return token
}

module.exports = {
  createERC20Token
}
