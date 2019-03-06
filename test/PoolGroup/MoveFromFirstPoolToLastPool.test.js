const PoolGroup = artifacts.require('PoolGroup')

contract('PoolGroup', () => {
  describe('moveFirstPoolToLastPool', () => {
    it('succeeds to move the first pool to the last pool', async () => {
      const poolGroup = await PoolGroup.new(7)
      const firstPoolIndex = await poolGroup.firstPoolIndex()
      const lastPoolIndex = await poolGroup.lastPoolIndex()
      assert.equal(firstPoolIndex, 1)
      assert.equal(lastPoolIndex, 7) 

      const term = 1
      const amount = 100e18
      await poolGroup.addToOneTimeDeposit(term, amount.toString())
      const pool = await poolGroup.poolsByIndex(term)
      assert.equal(pool.oneTimeDeposit, amount)
      assert.equal(pool.recurringDeposit, 0)

      await poolGroup.moveFirstPoolToLastPool()
      const updatedFirstPoolIndex = await poolGroup.firstPoolIndex()
      const updatedLastPoolIndex = await poolGroup.lastPoolIndex()
      assert.equal(updatedFirstPoolIndex, Number(firstPoolIndex) + 1)
      assert.equal(updatedLastPoolIndex, Number(lastPoolIndex) + 1)

      const firstPool = await poolGroup.poolsByIndex(updatedFirstPoolIndex)
      assert.equal(firstPool.oneTimeDeposit, 0)
      assert.equal(firstPool.recurringDeposit, 0)
      
      const lastPool = await poolGroup.poolsByIndex(updatedLastPoolIndex)
      assert.equal(lastPool.oneTimeDeposit, amount)
      assert.equal(lastPool.recurringDeposit, 0)
    })
  })
})
