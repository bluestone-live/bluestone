const PoolGroup = artifacts.require('PoolGroup')

contract('PoolGroup', () => {
  describe('addOneTimeDeposit', () => {
    it('succeeds to add one-time deposit', async () => {
      const poolGroup = await PoolGroup.new(7)
      const term = 1
      const amount = 100e18
      await poolGroup.addOneTimeDeposit(term, amount.toString())
      const pool = await poolGroup.pools.call(term)
      assert.equal(pool.oneTimeDeposit, amount)
      assert.equal(pool.recurringDeposit, 0)
    })
  })
})
