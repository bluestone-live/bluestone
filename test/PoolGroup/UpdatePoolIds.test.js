const PoolGroup = artifacts.require('PoolGroup')

contract('PoolGroup', () => {
  describe('updatePoolIds', () => {
    it('increments pool indexes correctly after one day', async () => {
      const term = 7
      const poolGroup = await PoolGroup.new(term)
      await poolGroup.updatePoolIds()
      const updatedPoolIndexes = [1, 2, 3, 4, 5, 6, 0]
            
      for (let i = 0; i < term; i++) {
        const poolId = await poolGroup.poolIds(i)
        assert.equal(poolId, updatedPoolIndexes[i])
      }
    })

    it('increments pool indexes correctly after seven days', async () => {
      const term = 7
      const poolGroup = await PoolGroup.new(term)
      const updatedPoolIndexes = [0, 1, 2, 3, 4, 5, 6]

      for (let i = 0; i < term; i++) {
        await poolGroup.updatePoolIds()
      } 

      for (let i = 0; i < term; i++) {
        const poolId = await poolGroup.poolIds(i)
        assert.equal(poolId, updatedPoolIndexes[i])
      }
    })
  })
})

