const Core = artifacts.require('Core')
const { BN, shouldFail } = require('openzeppelin-test-helpers')
const { createERC20Token } = require('../Utils.js')

contract('Core', function([owner, initialHolder]) {
  const initialSupply = new BN(100)
  let core, token

  beforeEach(async () => {
    core = await Core.new()
    token = await createERC20Token(initialHolder, initialSupply)
    await token.approve(core.address, initialSupply, { from: initialHolder })
  })

  describe('deposit', () => {
    const term = 1
    const amount = initialSupply

    describe('when the token is supported', () => {
      beforeEach(async () => {
        await core.enableDepositManager(token.address, { from: owner })
      })

      it('adds one-time deposit', async () => {
        const isRecurring = false
        await core.deposit(token.address, term, amount, isRecurring, { from: initialHolder })
      })

      it('adds recurring deposit', async () => {
        const isRecurring = true
        await core.deposit(token.address, term, amount, isRecurring, { from: initialHolder })
      })

      describe('when the term is invalid', () => {
        it('reverts', async () => {
          const isRecurring = false
          await shouldFail.reverting(
            core.deposit(token.address, 11, amount, isRecurring, { from: initialHolder })
          )
        })
      })
    })

    describe('when the token is not supported', () => {
      it('reverts', async () => {
        const isRecurring = false
        await shouldFail.reverting(
          core.deposit(token.address, term, amount, isRecurring, { from: initialHolder })
        )
      })
    })
  })
})
