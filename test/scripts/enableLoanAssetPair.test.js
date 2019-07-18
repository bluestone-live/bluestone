const LoanManager = artifacts.require("./LoanManager.sol")
const enableLoanAssetPair = require('../../scripts/javascript/enableLoanAssetPair.js')
const deployTokens = require('../../scripts/javascript/deployTokens.js')
const { expect } = require('chai')

describe('script: enableLoanAssetPair', () => {
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
    context('when the asset pair is not enabled', () => {
      it('succeeds', async () => {
        const [loanAsset, collateralAsset] = await enableLoanAssetPair(cb, network, loanTokenSymbol, collateralTokenSymbol)
        expect(await loanManager.isLoanAssetPairEnabled(loanAsset, collateralAsset)).to.be.true
      })
    })

    context('when the asset pair is enabled', () => {
      it('fails', async () => {
        const res = await enableLoanAssetPair(cb, network, loanTokenSymbol, collateralTokenSymbol)
        expect(res).to.be.false 
      })
    })

    context('when the assets are the same', () => {
      it('fails', async () => {
        const res = await enableLoanAssetPair(cb, network, loanTokenSymbol, loanTokenSymbol)
        expect(res).to.be.false 
      })
    })
  })
})
