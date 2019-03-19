const Core = artifacts.require('Core')
const { shouldFail } = require('openzeppelin-test-helpers')
const { createERC20Token } = require('../Utils.js')

contract('Core', function([owner, anotherAccount]) {
  let core, token

  beforeEach(async () => {
    core = await Core.new()
    token = await createERC20Token(owner)
    await core.enableDepositManager(token.address, { from: owner })
  })

  describe('updateDepositMaturity', () => {
    it('succeeds if called by owner', async () => {
      await core.updateDepositMaturity(token.address, { from: owner })
    })

    it('fails if not called by owner', async () => {
      await shouldFail.reverting(
        core.updateDepositMaturity(token.address, { from: anotherAccount })
      )
    })
  })
})
