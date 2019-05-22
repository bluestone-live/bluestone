const TokenFactory = artifacts.require('./TokenFactory.sol')
const Configuration = artifacts.require("./Configuration.sol")
const setCollateralRatio = require('../../scripts/javascript/setCollateralRatio.js')
const deployTokens = require('../../scripts/javascript/deployTokens.js')
const { toFixedBN } = require('../utils/index.js')
const { expect } = require('chai')

contract('Configuration', ([owner]) => {
  describe('script: setCollateralRatio', () => {
    let tokenFactory, config
    const cb = () => {}
    const loanTokenSymbol = 'ETH'
    const collateralTokenSymbol = 'DAI'

    before(async () => {
      tokenFactory = await TokenFactory.deployed()
      config = await Configuration.deployed()
      await deployTokens()
    })

    context('when the collateral ratio is valid', () => {
      const collateralRatio = 1.3

      it('succeeds', async () => {
        const [loanAsset, collateralAsset] = await setCollateralRatio(cb, loanTokenSymbol, collateralTokenSymbol, collateralRatio)
        expect(await config.getCollateralRatio(loanAsset, collateralAsset)).to.be.bignumber.equal(toFixedBN(collateralRatio))
      })
    })

    context('when the collateral ratio is invalid', () => {
      const collateralRatio = 1.1

      it('fails', async () => {
        const res = await setCollateralRatio(cb, loanTokenSymbol, collateralTokenSymbol, collateralRatio)
        expect(res).to.be.false 
      })
    })
  })
})
