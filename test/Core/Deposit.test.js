const Core = artifacts.require('Core')
const { BN, shouldFail } = require('openzeppelin-test-helpers')
const { createERC20Token } = require('../Utils.js')

contract('Core', function([owner, customer]) {
  const initialSupply = new BN(100)
  let core, token

  beforeEach(async () => {
    core = await Core.new()
    token = await createERC20Token(customer, initialSupply)
    await token.approve(core.address, initialSupply, { from: customer })
  })

  describe('deposit', () => {
    const term = 1

    describe('when the token is supported', () => {
      beforeEach(async () => {
        await core.enableDepositManager(token.address, { from: owner })
      })

      describe('when the customer has enough balance', () => {
        const amount = initialSupply

        it('adds one-time deposit', async () => {
          const isRecurring = false
          await core.deposit(token.address, term, amount, isRecurring, { from: customer })
          assert.equal((await token.balanceOf(customer)), 0)
          assert.equal((await token.balanceOf(core.address)), amount.toString())
        })

        it('adds recurring deposit', async () => {
          const isRecurring = true
          await core.deposit(token.address, term, amount, isRecurring, { from: customer })
          assert.equal((await token.balanceOf(customer)), 0)
          assert.equal((await token.balanceOf(core.address)), amount.toString())
        })
      })

      describe('when the customer does not have enough balance', () => {
        const amount = initialSupply.addn(1)

        it('reverts', async () => {
          await shouldFail.reverting(
            core.deposit(token.address, term, amount, { from: customer })
          )
        })
      })
    })

    describe('when the token is not supported', () => {
      const amount = initialSupply

      it('reverts', async () => {
        const isRecurring = false
        await shouldFail.reverting(
          core.deposit(token.address, term, amount, isRecurring, { from: customer })
        )
      })
    })
  })
})
