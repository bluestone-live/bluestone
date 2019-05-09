const PriceOracle = artifacts.require('PriceOracle')
const postTokenPrices = require('../../scripts/postTokenPrices.js')
const { createERC20Token, toFixedBN } = require('../Utils.js')
const { expect } = require('chai')

contract('PriceOracle', function([owner, account]) {
  let priceOracle, ETH, DAI, USDC

  before(async () => {
    priceOracle = await PriceOracle.deployed()
    ETH = await createERC20Token(account)
    DAI = await createERC20Token(account)
    USDC = await createERC20Token(account)
  })

  describe('script: postTokenPrices', () => {
    it('updates prices for each token', async () => {
      const tokenList = [
        { name: 'ETH', address: ETH.address },
        { name: 'DAI', address: DAI.address },
        { name: 'USDC', address: USDC.address }
      ]

      const [priceETH, priceDAI, priceUSDC] = await postTokenPrices(tokenList)

      expect(await priceOracle.getPrice(ETH.address)).to.be.bignumber.equal(priceETH)
      expect(await priceOracle.getPrice(DAI.address)).to.be.bignumber.equal(priceDAI)
      expect(await priceOracle.getPrice(USDC.address)).to.be.bignumber.equal(priceUSDC)
    })
  })
})
