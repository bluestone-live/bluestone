const TokenFactory = artifacts.require('./TokenFactory.sol')
const DepositManager = artifacts.require("./DepositManager.sol")
const enableDepositAsset = require('../../scripts/enableDepositAsset.js')
const disableDepositAsset = require('../../scripts/disableDepositAsset.js')
const deployTokens = require('../../scripts/deployTokens.js')
const { constants, shouldFail } = require('openzeppelin-test-helpers')
const { expect } = require('chai')

contract('TokenFactory', ([owner]) => {
  describe('script: disableDepositAsset', () => {
    let tokenFactory, depositManager
    const cb = () => {}
    const tokenSymbol = 'ETH'

    before(async () => {
      tokenFactory = await TokenFactory.deployed()
      depositManager = await DepositManager.deployed()
      await deployTokens()
    })

    context('when the deposit is not enabled', () => {
      it('fails', async () => {
        const asset = await disableDepositAsset(cb, tokenSymbol) 
        expect(asset).to.be.false 
      })
    })

    context('when the deposit is enabled', () => {
      before(async () => {
        const asset = await enableDepositAsset(cb, tokenSymbol)        
        expect(await depositManager.isDepositAssetEnabled(asset)).to.be.true
      })

      it('succeeds', async () => {
        const asset = await disableDepositAsset(cb, tokenSymbol)
        expect(await depositManager.isDepositAssetEnabled(asset)).to.be.false
      })
    })
  })
})
