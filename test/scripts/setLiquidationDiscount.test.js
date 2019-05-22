const TokenFactory = artifacts.require('./TokenFactory.sol')
const Configuration = artifacts.require("./Configuration.sol")
const setLiquidationDiscount = require('../../scripts/javascript/setLiquidationDiscount.js')
const deployTokens = require('../../scripts/javascript/deployTokens.js')
const { toFixedBN } = require('../utils/index.js')
const { expect } = require('chai')

contract('Configuration', ([owner]) => {
  describe('script: setLiquidationDiscount', () => {
    let tokenFactory, config
    const cb = () => {}
    const loanTokenSymbol = 'ETH'
    const collateralTokenSymbol = 'DAI'

    before(async () => {
      tokenFactory = await TokenFactory.deployed()
      config = await Configuration.deployed()
      await deployTokens()
    })

    context('when the liquidation discount is valid', () => {
      const liquidationDiscount = 0.05

      it('succeeds', async () => {
        const [loanAsset, collateralAsset] = await setLiquidationDiscount(cb, loanTokenSymbol, collateralTokenSymbol, liquidationDiscount)
        expect(await config.getLiquidationDiscount(loanAsset, collateralAsset)).to.be.bignumber.equal(toFixedBN(liquidationDiscount))
      })
    })

    context('when the liquidation discount is invalid', () => {
      const liquidationDiscount = 0.06

      it('fails', async () => {
        const res = await setLiquidationDiscount(cb, loanTokenSymbol, collateralTokenSymbol, liquidationDiscount)
        expect(res).to.be.false 
      })
    })
  })
})
