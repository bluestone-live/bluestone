const Core = artifacts.require('Core')
const DepositManager = artifacts.require('DepositManager')
const { fakeAssetAddresses } = require('../Utils.js')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Core', function([owner, ...accounts]) {
  let core
  const { ETH: asset } = fakeAssetAddresses

  describe('enableDepositManager', () => {
    beforeEach(async () => {
      core = await Core.new()
      assert.equal((await core.isDepositManagerEnabled(asset)), false)
    })

    it('succeeds if called by owner', async () => {
      await core.enableDepositManager(asset, { from: owner })
      assert.equal((await core.isDepositManagerEnabled(asset)), true)
    })

    it('fails if not called by owner', async () => {
      await shouldFail.reverting(
        core.enableDepositManager(asset, { from: accounts[0] })
      )
    })
  })
})
