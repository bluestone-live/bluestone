const Core = artifacts.require('Core')
const { fakeAssetAddresses } = require('../Utils.js')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Core', function([owner, ...accounts]) {
  let core
  const { ETH: asset } = fakeAssetAddresses

  describe('updateDepositMaturity', () => {
    beforeEach(async () => {
      core = await Core.new()
      await core.enableDepositManager(asset, { from: owner })
    })

    it('succeeds if called by owner', async () => {
      await core.updateDepositMaturity(asset, { from: owner })
    })

    it('fails if not called by owner', async () => {
      await shouldFail.reverting(
        core.updateDepositMaturity(asset, { from: accounts[0] })
      )
    })
  })
})
