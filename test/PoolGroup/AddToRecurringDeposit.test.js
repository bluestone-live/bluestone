const PoolGroup = artifacts.require('PoolGroup')

contract('PoolGroup', () => {
  describe('addRecurringDeposit', () => {
    it('succeeds to add recurring deposit', async () => {
      const poolGroup = await PoolGroup.new(7)
      const term = 1
      const amount = 100e18
      await poolGroup.addToRecurringDeposit(term, amount.toString())
      const pool = await poolGroup.poolsByIndex(term)
      assert.equal(pool.oneTimeDeposit, 0)
      assert.equal(pool.recurringDeposit, amount)
    })
  })
})
