const DepositManager = artifacts.require("./DepositManager.sol")
const deployTokens = require('../../scripts/javascript/deployTokens.js')
const enableDepositAsset = require('../../scripts/javascript/enableDepositAsset.js')
const updateInterestIndexHistories = require('../../scripts/javascript/updateInterestIndexHistories.js')
const { expect } = require('chai')

contract('DepositManager', function([owner, account]) {
  let depositManager
  const cb = () => {}

  before(async () => {
    depositManager = await DepositManager.deployed()
    await deployTokens()
  })

  describe('script: updateInterestIndexHistories', () => {
    context('when no deposit asset is enabled', () => {
      it('fails', async () => {
        const res = await updateInterestIndexHistories()
        expect(res).to.be.false
      })
    })

    context('when deposit assets are enabled', () => {
      before(async () => {
        await enableDepositAsset(cb, 'ETH') 
        await enableDepositAsset(cb, 'DAI') 
        await enableDepositAsset(cb, 'USDT') 
      })

      it('succeeds', async () => {
        const res = await updateInterestIndexHistories()
        expect(res.length).to.equal(3)
      })
    })
  })
})
