const DepositManager = artifacts.require('DepositManager')
const { shouldFail, constants } = require('openzeppelin-test-helpers')
const { expect } = require('chai')

contract('DepositManager', ([owner, depositor]) => {
  let depositManager

  before(async () => {
    depositManager = await DepositManager.deployed() 
  })

  describe('pause deposit manager', () => {
    const asset = constants.ZERO_ADDRESS

    context('when paused', () => {
      before(async () => {
        await depositManager.pause()
      })

      it('reverts on public call', async() => {
        await shouldFail.reverting(
          depositManager.isDepositAssetEnabled(asset, { from: depositor })
        )
      })
    })

    context('when unpaused', () => {
      before(async () => {
        await depositManager.unpause()
      })

      it('succeeds on public call', async() => {
        const enabled = await depositManager.isDepositAssetEnabled(asset, { from: depositor })
        expect(enabled).to.be.false
      })
    })
  })
})
