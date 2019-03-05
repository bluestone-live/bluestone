const PoolGroup = artifacts.require('PoolGroup')

contract('PoolGroup', () => {
  describe('constructor', () => {
    it('updates the first and last pool keys correctly', async () => {
      const term = 7
      const poolGroup = await PoolGroup.new(term)
      const firstPoolKey = await poolGroup.firstPoolKey()
      const lastPoolKey = await poolGroup.lastPoolKey()

      assert.equal(firstPoolKey, 1)
      assert.equal(lastPoolKey, term) 
    })
  })
})
