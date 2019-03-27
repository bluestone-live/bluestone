const PoolGroup = artifacts.require('PoolGroup')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('PoolGroup', () => {
  describe('withdrawOneTimeDepositFromPool', () => {
    it('succeeds to withdraw one-time deposit', async () => {
      const poolGroup = await PoolGroup.new(7)
      const index = 0
      const depositAmount = 100e18
      const withdrawAmount = 50e18

      await poolGroup.addOneTimeDepositToPool(index, depositAmount.toString())
      await poolGroup.withdrawOneTimeDepositFromPool(index, withdrawAmount.toString())

      const poolId = await poolGroup.poolIds(index)
      const pool = await poolGroup.poolsById(poolId)

      assert.equal(pool.oneTimeDeposit, depositAmount - withdrawAmount)
      assert.equal(pool.recurringDeposit, 0)
      assert.equal(pool.loanableAmount, depositAmount - withdrawAmount)
      assert.equal((await poolGroup.totalDeposit()), depositAmount - withdrawAmount)
      assert.equal((await poolGroup.totalLoan()), 0)
    })

    it('fails if withdraw amount is greater than one-time deposit amount', async () => {
      const poolGroup = await PoolGroup.new(7)
      const index = 0
      const depositAmount = 100e18
      const withdrawAmount = 101e18

      await poolGroup.addOneTimeDepositToPool(index, depositAmount.toString())

      const promise = poolGroup.withdrawOneTimeDepositFromPool(index, withdrawAmount.toString())
      await shouldFail.reverting(promise)
    })
  })
})
