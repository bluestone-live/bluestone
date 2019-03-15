const Core = artifacts.require('Core')
const { fakeAssetAddresses } = require('../Utils.js')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Core', function([owner, ...accounts]) {
  let core
  const { ETH: asset } = fakeAssetAddresses

  describe('disableDepositManager', () => {
    beforeEach(async () => {
      core = await Core.new()
      await core.enableDepositManager(asset, { from: owner })
      assert.equal((await core.isDepositManagerEnabled(asset)), true)
    })

    it('succeeds if called by owner', async () => {
      await core.disableDepositManager(asset, { from: owner})
      assert.equal((await core.isDepositManagerEnabled(asset)), false)
    })

    it('fails if not called by owner', async () => {
      await shouldFail.reverting(
        core.disableDepositManager(asset, { from: accounts[0] })
      )
    })
  })
})
