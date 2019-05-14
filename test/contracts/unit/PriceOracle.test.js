const PriceOracle = artifacts.require('PriceOracle')
const { createERC20Token, toFixedBN } = require('../../utils/index.js')
const { expect } = require('chai')

contract('PriceOracle', function([owner, account]) {
  let priceOracle, ETH, DAI, USDC

  before(async () => {
    priceOracle = await PriceOracle.deployed()
    ETH = await createERC20Token(account)
    DAI = await createERC20Token(account)
    USDC = await createERC20Token(account)
  })

  describe('#setPrice', () => {
    const price = toFixedBN(5)

    it('succeeds', async () => {
      await priceOracle.setPrice(ETH.address, price, { from: owner })
    })

    it('updates price', async () => {
      expect(await priceOracle.getPrice(ETH.address)).to.be.bignumber.equal(price)
    })
  })

  describe('#setPrices', () => {
    it('succeeds', async () => {
      const assetList = [ETH.address, DAI.address, USDC.address]
      const priceList = [1, 2, 3]
      await priceOracle.setPrices(assetList, priceList, { from: owner })
    })

    it('updates price for each token', async () => {
      expect(await priceOracle.getPrice(ETH.address)).to.be.bignumber.equal('1')
      expect(await priceOracle.getPrice(DAI.address)).to.be.bignumber.equal('2')
      expect(await priceOracle.getPrice(USDC.address)).to.be.bignumber.equal('3')
    })
  })
})
