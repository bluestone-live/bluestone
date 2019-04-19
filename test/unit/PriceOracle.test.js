const PriceOracle = artifacts.require('PriceOracle')
const { createERC20Token, toFixedBN } = require('../Utils.js')
const { expect } = require('chai')

contract('PriceOracle', function([owner, account]) {
  let priceOracle, asset

  before(async () => {
    priceOracle = await PriceOracle.deployed()
    asset = await createERC20Token(account)
  })

  describe('#setPrice', () => {
    const price = toFixedBN(5)

    it('succeeds', async () => {
      await priceOracle.setPrice(asset.address, price, { from: owner })
    })

    it('updates price', async () => {
      expect(await priceOracle.getPrice(asset.address)).to.be.bignumber.equal(price)
    })
  })
})
