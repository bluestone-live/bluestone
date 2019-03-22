const PoolGroup = artifacts.require('PoolGroup')

contract('PoolGroup', () => {
  describe('constructor', () => {
    it('populates pools and poolIds', async () => {
      const term = 7
      const poolGroup = await PoolGroup.new(term)
      assert.equal((await poolGroup.totalDeposit()), 0)
      assert.equal((await poolGroup.totalLoan()), 0)

      for (let i = 0; i < term; i++) {
        const poolIndex = await poolGroup.poolIndexes(i)
        const pool = await poolGroup.pools(poolIndex);
        assert.equal(poolIndex, i)
        assert.equal(pool.oneTimeDeposit, 0)
        assert.equal(pool.recurringDeposit, 0)
        assert.equal(pool.loanableAmount, 0)
      }
    })
  })
})
