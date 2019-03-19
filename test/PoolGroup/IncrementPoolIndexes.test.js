const PoolGroup = artifacts.require('PoolGroup')

contract('PoolGroup', () => {
  describe('incrementPoolIndexes', () => {
    it('increments pool indexes correctly after one day', async () => {
      const term = 7
      const poolGroup = await PoolGroup.new(term)
      await poolGroup.incrementPoolIndexes()
      const updatedPoolIndexes = [1, 2, 3, 4, 5, 6, 0]
            
      for (let i = 0; i < term; i++) {
        const poolIndex = await poolGroup.poolIndexes(i)
        assert.equal(poolIndex, updatedPoolIndexes[i])
      }
    })

    it('increments pool indexes correctly after seven days', async () => {
      const term = 7
      const poolGroup = await PoolGroup.new(term)
      const updatedPoolIndexes = [0, 1, 2, 3, 4, 5, 6]

      for (let i = 0; i < term; i++) {
        await poolGroup.incrementPoolIndexes()
      } 

      for (let i = 0; i < term; i++) {
        const poolIndex = await poolGroup.poolIndexes(i)
        assert.equal(poolIndex, updatedPoolIndexes[i])
      }
    })
  })
})

