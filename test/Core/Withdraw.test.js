const Core = artifacts.require('Core')
const { BN, shouldFail, time } = require('openzeppelin-test-helpers')
const { createERC20Token } = require('../Utils.js')

contract('Core', function([owner, customer]) {
  let core, token
  const initialSupply = new BN(100)

  beforeEach(async () => {
    core = await Core.new()
    token = await createERC20Token(customer, initialSupply)
    await token.approve(core.address, initialSupply, { from: customer })
    await core.enableDepositManager(token.address, { from: owner })
  })

  describe('withdraw', () => {
    const term = 1
    const amount = initialSupply
    const depositId = 0

    beforeEach(async () => {
      const isRecurring = false
      await core.deposit(token.address, term, amount, isRecurring, { from: customer })
    })

    describe('when the deposit is not matured', () => {
      it('reverts', async () => {
        const lessThanOneDay = 23 * 60 * 60
        await time.increase(lessThanOneDay)
        await shouldFail.reverting(
          core.withdraw(token.address, depositId, { from: customer })
        )
      })
    })

    describe('when the deposit is matured', () => {
      it('withdraws', async () => {
        const oneDay = 24 * 60 * 60
        await time.increase(oneDay)
        await core.updateDepositMaturity(token.address)
        await core.withdraw(token.address, depositId, { from: customer })
        assert.equal((await token.balanceOf(customer)), amount.toString())
        assert.equal((await token.balanceOf(core.address)), 0)
      })
    })
  })
})
