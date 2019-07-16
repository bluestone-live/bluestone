const PriceOracle = artifacts.require('PriceOracle')
const TokenFactory = artifacts.require('TokenFactory')
const deployTokens = require('../../scripts/javascript/deployTokens.js')
const postTokenPrices = require('../../scripts/javascript/postTokenPrices.js')
const { createERC20Token, toFixedBN } = require('../utils/index.js')
const { expect } = require('chai')

contract('PriceOracle', function([owner, account]) {
  let priceOracle, tokenFactory

  before(async () => {
    priceOracle = await PriceOracle.deployed()
    tokenFactory = await TokenFactory.deployed()
    await deployTokens()
  })

  describe('script: postTokenPrices', () => {
    it('updates prices for each token', async () => {
      const ETH = await tokenFactory.getToken('ETH')
      const DAI = await tokenFactory.getToken('DAI')
      const USDT = await tokenFactory.getToken('USDT')
      const [priceETH, priceDAI, priceUSDT] = await postTokenPrices()

      expect(await priceOracle.getPrice(ETH)).to.be.bignumber.equal(priceETH)
      expect(await priceOracle.getPrice(DAI)).to.be.bignumber.equal(priceDAI)
      expect(await priceOracle.getPrice(USDT)).to.be.bignumber.equal(priceUSDT)
    })
  })
})
