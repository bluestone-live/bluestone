const PoolGroup = artifacts.require('PoolGroup')

contract('PoolGroup', () => {
  describe('addRecurringDeposit', () => {
    it('succeeds to add recurring deposit', async () => {
      const poolGroup = await PoolGroup.new(7)
      const index = 0
      const amount = 100e18
      await poolGroup.addRecurringDepositToPool(index, amount.toString())
      const poolId = await poolGroup.poolIds(index)
      const pool = await poolGroup.poolsById(poolId)

      assert.equal(pool.oneTimeDeposit, 0)
      assert.equal(pool.recurringDeposit, amount)
      assert.equal(pool.loanableAmount, amount)
      assert.equal((await poolGroup.totalDeposit()), amount)
    })
  })
})
