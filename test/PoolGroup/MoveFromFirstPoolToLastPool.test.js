const PoolGroup = artifacts.require('PoolGroup')

contract('PoolGroup', () => {
  describe('moveFirstPoolToLastPool', () => {
    it('succeeds to move the first pool to the last pool', async () => {
      const poolGroup = await PoolGroup.new(7)
      const firstPoolKey = await poolGroup.firstPoolKey()
      const lastPoolKey = await poolGroup.lastPoolKey()
      assert.equal(firstPoolKey, 1)
      assert.equal(lastPoolKey, 7) 

      const term = 1
      const amount = 100e18
      await poolGroup.addToOneTimeDeposit(term, amount.toString())
      const pool = await poolGroup.pools.call(term)
      assert.equal(pool.oneTimeDeposit, amount)
      assert.equal(pool.recurringDeposit, 0)

      await poolGroup.moveFirstPoolToLastPool()
      const updatedFirstPoolKey = await poolGroup.firstPoolKey()
      const updatedLastPoolKey = await poolGroup.lastPoolKey()
      assert.equal(updatedFirstPoolKey, Number(firstPoolKey) + 1)
      assert.equal(updatedLastPoolKey, Number(lastPoolKey) + 1)

      const firstPool = await poolGroup.pools.call(updatedFirstPoolKey)
      assert.equal(firstPool.oneTimeDeposit, 0)
      assert.equal(firstPool.recurringDeposit, 0)
      
      const lastPool = await poolGroup.pools.call(updatedLastPoolKey)
      assert.equal(lastPool.oneTimeDeposit, amount)
      assert.equal(lastPool.recurringDeposit, 0)
    })
  })
})
