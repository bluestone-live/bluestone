const LoanManager = artifacts.require("./LoanManager.sol")
const enableLoanAssetPair = require('../../scripts/javascript/enableLoanAssetPair.js')
const disableLoanAssetPair = require('../../scripts/javascript/disableLoanAssetPair.js')
const deployTokens = require('../../scripts/javascript/deployTokens.js')
const { expect } = require('chai')

describe('script: disableLoanAssetPair', () => {
  let loanManager
  const cb = () => {}
  const network = 'development'
  const loanTokenSymbol = 'ETH'
  const collateralTokenSymbol = 'DAI'

  before(async () => {
    loanManager = await LoanManager.deployed()
    await deployTokens(cb, network)
  })

  contract('LoanManager', () => {
    context('when the deposit is not enabled', () => {
      it('fails', async () => {
        const res = await disableLoanAssetPair(cb, network, loanTokenSymbol, collateralTokenSymbol) 
        expect(res).to.be.false 
      })
    })

    context('when the deposit is enabled', () => {
      before(async () => {
        const [loanAsset, collateralAsset] = await enableLoanAssetPair(cb, network, loanTokenSymbol, collateralTokenSymbol)        
        expect(await loanManager.isLoanAssetPairEnabled(loanAsset, collateralAsset)).to.be.true
      })

      it('succeeds', async () => {
        const [loanAsset, collateralAsset] = await disableLoanAssetPair(cb, network, loanTokenSymbol, collateralTokenSymbol)
        expect(await loanManager.isLoanAssetPairEnabled(loanAsset, collateralAsset)).to.be.false
      })
    })
  })
})
