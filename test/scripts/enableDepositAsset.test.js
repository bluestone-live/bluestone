const DepositManager = artifacts.require("./DepositManager.sol")
const enableDepositAsset = require('../../scripts/javascript/enableDepositAsset.js')
const deployTokens = require('../../scripts/javascript/deployTokens.js')
const { expect } = require('chai')

describe('script: enableDepositAsset', () => {
  let depositManager
  const cb = () => {}
  const network = 'development'
  const tokenSymbol = 'ETH'

  before(async () => {
    depositManager = await DepositManager.deployed()
    await deployTokens(cb, network)
  })

  contract('DepositManager', () => {
    context('when the asset is not enabled', () => {
      it('succeeds', async () => {
        const asset = await enableDepositAsset(cb, network, tokenSymbol)
        expect(await depositManager.isDepositAssetEnabled(asset)).to.be.true
      })
    })

    context('when the asset is enabled', () => {
      it('fails', async () => {
        const asset = await enableDepositAsset(cb, network, tokenSymbol)
        expect(asset).to.be.false 
      })
    })
  })
})
