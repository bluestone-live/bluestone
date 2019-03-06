const PoolGroup = artifacts.require('PoolGroup')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('PoolGroup', () => {
  describe('withdrawRecurringDeposit', () => {
    it('succeeds to withdraw recurring deposit', async () => {
      const poolGroup = await PoolGroup.new(7)
      const term = 1
      const depositAmount = 100e18
      const withdrawAmount = 50e18
      await poolGroup.addToRecurringDeposit(term, depositAmount.toString())
      await poolGroup.withdrawRecurringDeposit(term, withdrawAmount.toString())
      const pool = await poolGroup.pools.call(term)
      assert.equal(pool.oneTimeDeposit, 0)
      assert.equal(pool.recurringDeposit, depositAmount - withdrawAmount)
    })

    it('fails if withdraw amount is greater than recurring deposit amount', async () => {
      const poolGroup = await PoolGroup.new(7)
      const term = 1
      const depositAmount = 100e18
      const withdrawAmount = 101e18
      await poolGroup.addToRecurringDeposit(term, depositAmount.toString())

      const promise = poolGroup.withdrawRecurringDeposit(term, withdrawAmount.toString())
      await shouldFail.reverting(promise)
    })
  })
})
