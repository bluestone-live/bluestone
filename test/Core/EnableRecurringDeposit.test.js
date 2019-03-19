const Core = artifacts.require('Core')
const { BN, shouldFail } = require('openzeppelin-test-helpers')
const { createERC20Token } = require('../Utils.js')

contract('Core', function([owner, initialHolder]) {
  let core, token
  const initialSupply = new BN(100)

  beforeEach(async () => {
    core = await Core.new()
    token = await createERC20Token(initialHolder, initialSupply)
    await token.approve(core.address, initialSupply, { from: initialHolder })
    await core.enableDepositManager(token.address, { from: owner })
  })

  describe('enableRecurringDeposit', () => {
    const term = 7
    const amount = initialSupply
    const depositId = 0

    describe('when the deposit exists', () => {
      beforeEach(async () => {
        await core.deposit(token.address, term, amount, false, { from: initialHolder })
      })

      it('enables recurring deposit', async () => {
        await core.enableRecurringDeposit(token.address, depositId, { from: initialHolder })
      })
    })

    describe('when the deposit does not exist', () => {
      it('reverts', async () => { 
        await shouldFail.reverting(
          core.enableRecurringDeposit(token.address, 1, { from: initialHolder })
        )
      })
    })
  })
})
