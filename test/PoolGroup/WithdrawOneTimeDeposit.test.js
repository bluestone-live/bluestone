const PoolGroup = artifacts.require('PoolGroup')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('PoolGroup', () => {
  describe('withdrawOneTimeDeposit', () => {
    it('succeeds to withdraw one-time deposit', async () => {
      const poolGroup = await PoolGroup.new(7)
      const term = 1
      const depositAmount = 100e18
      const withdrawAmount = 50e18

      await poolGroup.addToOneTimeDeposit(term, depositAmount.toString())
      await poolGroup.withdrawOneTimeDeposit(term, withdrawAmount.toString())

      const poolIndex = await poolGroup.getPoolIndexByTerm(term)
      const pool = await poolGroup.pools(poolIndex)

      assert.equal(pool.oneTimeDeposit, depositAmount - withdrawAmount)
      assert.equal(pool.recurringDeposit, 0)
    })

    it('fails if withdraw amount is greater than one-time deposit amount', async () => {
      const poolGroup = await PoolGroup.new(7)
      const term = 1
      const depositAmount = 100e18
      const withdrawAmount = 101e18

      await poolGroup.addToOneTimeDeposit(term, depositAmount.toString())

      const promise = poolGroup.withdrawOneTimeDeposit(term, withdrawAmount.toString())
      await shouldFail.reverting(promise)
    })
  })
})
