const PoolGroup = artifacts.require('PoolGroup')

contract('PoolGroup', () => {
  describe('addOneTimeDepositToPool', () => {
    it('succeeds to add one-time deposit', async () => {
      const poolGroup = await PoolGroup.new(7)
      const index = 0
      const amount = 100e18
      await poolGroup.addOneTimeDepositToPool(index, amount.toString())
      const poolId = await poolGroup.poolIds(index)
      const pool = await poolGroup.poolsById(poolId)

      assert.equal(pool.oneTimeDeposit, amount)
      assert.equal(pool.recurringDeposit, 0)
      assert.equal(pool.loanableAmount, amount)
      assert.equal((await poolGroup.totalDeposit()), amount)
    })
  })
})
