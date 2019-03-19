const Deposit = artifacts.require('Deposit')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Deposit', ([owner, anotherAccount]) => {
  const amount = 100e18.toString()
  const interestIndex = 10e18.toString()

  describe('withdraw', () => {
    it('succeeds to withdraw if matured', async () => {
      const deposit = await Deposit.new(owner, 0, amount, interestIndex, false)
      await deposit.withdraw(owner, interestIndex) 
      assert.equal((await deposit.isWithdrawn()), true)
    })

    it('fails to withdraw if not matured', async () => {
      const deposit = await Deposit.new(owner, 1, amount, interestIndex, false)
      await shouldFail.reverting(deposit.withdraw(owner, interestIndex))
    })

    it('fails to withdraw if not by owner', async () => {
      const deposit = await Deposit.new(owner, 1, amount, interestIndex, false)
      await shouldFail.reverting(deposit.withdraw(anotherAccount, interestIndex))
    })

    it('fails to withdraw if is recurring', async () => {
      const deposit = await Deposit.new(owner, 0, amount, interestIndex, true)
      await shouldFail.reverting(deposit.withdraw(owner, interestIndex))
    })

    it('fails to withdraw if is withdrawn', async () => {
      const deposit = await Deposit.new(owner, 0, amount, interestIndex, false)
      await deposit.withdraw(owner, interestIndex) 
      await shouldFail.reverting(deposit.withdraw(owner, interestIndex))
    })
  })
})

