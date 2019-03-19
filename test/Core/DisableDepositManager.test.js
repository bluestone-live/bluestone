const Core = artifacts.require('Core')
const { createERC20Token } = require('../Utils.js')
const { BN, shouldFail } = require('openzeppelin-test-helpers')

contract('Core', function([owner, anotherAccount]) {
  let core, token

  beforeEach(async () => {
    token = await createERC20Token(owner)
  })

  describe('disableDepositManager', () => {
    beforeEach(async () => {
      core = await Core.new()
      await core.enableDepositManager(token.address, { from: owner })
      assert.equal((await core.isDepositManagerEnabled(token.address)), true)
    })

    it('succeeds if called by owner', async () => {
      await core.disableDepositManager(token.address, { from: owner})
      assert.equal((await core.isDepositManagerEnabled(token.address)), false)
    })

    it('fails if not called by owner', async () => {
      await shouldFail.reverting(
        core.disableDepositManager(token.address, { from: anotherAccount })
      )
    })
  })
})
