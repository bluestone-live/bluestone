const TokenFactory = artifacts.require('./TokenFactory.sol')
const LoanManager = artifacts.require("./LoanManager.sol")
const enableLoanAssetPair = require('../../scripts/enableLoanAssetPair.js')
const deployTokens = require('../../scripts/deployTokens.js')
const { constants } = require('openzeppelin-test-helpers')
const { expect } = require('chai')

contract('TokenFactory', ([owner]) => {
  describe('script: enableLoanAssetPair', () => {
    let tokenFactory, loanManager
    const cb = () => {}
    const loanTokenSymbol = 'ETH'
    const collateralTokenSymbol = 'DAI'

    before(async () => {
      tokenFactory = await TokenFactory.deployed()
      loanManager = await LoanManager.deployed()
      await deployTokens()
    })

    context('when the asset pair is not enabled', () => {
      it('succeeds', async () => {
        const [loanAsset, collateralAsset] = await enableLoanAssetPair(cb, loanTokenSymbol, collateralTokenSymbol)
        expect(await loanManager.isLoanAssetPairEnabled(loanAsset, collateralAsset)).to.be.true
      })
    })

    context('when the asset pair is enabled', () => {
      it('fails', async () => {
        const res = await enableLoanAssetPair(cb, loanTokenSymbol, collateralTokenSymbol)
        expect(res).to.be.false 
      })
    })

    context('when the assets are the same', () => {
      it('fails', async () => {
        const res = await enableLoanAssetPair(cb, loanTokenSymbol, loanTokenSymbol)
        expect(res).to.be.false 
      })
    })
  })
})
