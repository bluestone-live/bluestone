const Core = artifacts.require('Core')
const DepositManager = artifacts.require('DepositManager')
const { shouldFail } = require('openzeppelin-test-helpers')
const { createERC20Token } = require('../Utils.js')

contract('Core', function([owner, anotherAccount]) {
  let core, token

  beforeEach(async () => {
    token = await createERC20Token(owner)
  })

  describe('enableDepositManager', () => {
    beforeEach(async () => {
      core = await Core.new()
      assert.equal((await core.isDepositManagerEnabled(token.address)), false)
    })

    it('succeeds if called by owner', async () => {
      await core.enableDepositManager(token.address, { from: owner })
      assert.equal((await core.isDepositManagerEnabled(token.address)), true)
    })

    it('fails if not called by owner', async () => {
      await shouldFail.reverting(
        core.enableDepositManager(token.address, { from: anotherAccount })
      )
    })
  })
})
