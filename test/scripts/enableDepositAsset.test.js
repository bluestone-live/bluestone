const TokenFactory = artifacts.require('./TokenFactory.sol')
const DepositManager = artifacts.require("./DepositManager.sol")
const enableDepositAsset = require('../../scripts/enableDepositAsset.js')
const deployTokens = require('../../scripts/deployTokens.js')
const { constants } = require('openzeppelin-test-helpers')
const { expect } = require('chai')

contract('TokenFactory', ([owner]) => {
  describe('script: enableDepositAsset', () => {
    let tokenFactory, depositManager
    const cb = () => {}
    const tokenSymbol = 'ETH'

    before(async () => {
      tokenFactory = await TokenFactory.deployed()
      depositManager = await DepositManager.deployed()
      await deployTokens()
    })

    context('when the asset is not enabled', () => {
      it('succeeds', async () => {
        const asset = await enableDepositAsset(cb, tokenSymbol)
        expect(await depositManager.isDepositAssetEnabled(asset)).to.be.true
      })
    })

    context('when the asset is enabled', () => {
      it('fails', async () => {
        const asset = await enableDepositAsset(cb, tokenSymbol)
        expect(asset).to.be.false 
      })
    })
  })
})
