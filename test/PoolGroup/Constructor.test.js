const PoolGroup = artifacts.require('PoolGroup')

contract('PoolGroup', () => {
  describe('constructor', () => {
    it('updates the first and last pool indexes correctly', async () => {
      const term = 7
      const poolGroup = await PoolGroup.new(term)
      const firstPoolIndex = await poolGroup.firstPoolIndex()
      const lastPoolIndex = await poolGroup.lastPoolIndex()

      assert.equal(firstPoolIndex, 1)
      assert.equal(lastPoolIndex, term) 
    })
  })
})
