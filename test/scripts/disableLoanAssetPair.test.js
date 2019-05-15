const TokenFactory = artifacts.require('./TokenFactory.sol')
const LoanManager = artifacts.require("./LoanManager.sol")
const enableLoanAssetPair = require('../../scripts/enableLoanAssetPair.js')
const disableLoanAssetPair = require('../../scripts/disableLoanAssetPair.js')
const deployTokens = require('../../scripts/deployTokens.js')
const { constants, shouldFail } = require('openzeppelin-test-helpers')
const { expect } = require('chai')

contract('TokenFactory', ([owner]) => {
  describe('script: disableLoanAssetPair', () => {
    let tokenFactory, loanManager
    const cb = () => {}
    const loanTokenSymbol = 'ETH'
    const collateralTokenSymbol = 'DAI'

    before(async () => {
      tokenFactory = await TokenFactory.deployed()
      loanManager = await LoanManager.deployed()
      await deployTokens()
    })

    context('when the deposit is not enabled', () => {
      it('fails', async () => {
        const res = await disableLoanAssetPair(cb, loanTokenSymbol, collateralTokenSymbol) 
        expect(res).to.be.false 
      })
    })

    context('when the deposit is enabled', () => {
      before(async () => {
        const [loanAsset, collateralAsset] = await enableLoanAssetPair(cb, loanTokenSymbol, collateralTokenSymbol)        
        expect(await loanManager.isLoanAssetPairEnabled(loanAsset, collateralAsset)).to.be.true
      })

      it('succeeds', async () => {
        const [loanAsset, collateralAsset] = await disableLoanAssetPair(cb, loanTokenSymbol, collateralTokenSymbol)
        expect(await loanManager.isLoanAssetPairEnabled(loanAsset, collateralAsset)).to.be.false
      })
    })
  })
})
