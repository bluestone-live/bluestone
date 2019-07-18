const DepositManager = artifacts.require("./DepositManager.sol")
const enableDepositAsset = require('../../scripts/javascript/enableDepositAsset.js')
const disableDepositAsset = require('../../scripts/javascript/disableDepositAsset.js')
const deployTokens = require('../../scripts/javascript/deployTokens.js')
const { expect } = require('chai')

describe('script: disableDepositAsset', () => {
  let depositManager
  const cb = () => {}
  const network = 'development'
  const tokenSymbol = 'ETH'

  before(async () => {
    depositManager = await DepositManager.deployed()
    await deployTokens(cb, network)
  })

  contract('DepositManager', () => {
    context('when the deposit is not enabled', () => {
      it('fails', async () => {
        const asset = await disableDepositAsset(cb, network, tokenSymbol) 
        expect(asset).to.be.false 
      })
    })

    context('when the deposit is enabled', () => {
      before(async () => {
        const asset = await enableDepositAsset(cb, network, tokenSymbol)        
        expect(await depositManager.isDepositAssetEnabled(asset)).to.be.true
      })

      it('succeeds', async () => {
        const asset = await disableDepositAsset(cb, network, tokenSymbol)
        expect(await depositManager.isDepositAssetEnabled(asset)).to.be.false
      })
    })
  })
})
