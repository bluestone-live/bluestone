const PoolGroup = artifacts.require('PoolGroup')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('PoolGroup', () => {
  describe('repayLoanToPool', () => {
    it('succeeds', async () => {
      const poolGroup = await PoolGroup.new(7)
      const index = 0
      const amount = 100e18
      await poolGroup.addOneTimeDepositToPool(index, amount.toString())
      const poolId = await poolGroup.poolIds(index)
      const loanTerm = 1

      await poolGroup.loanFromPool(index, amount.toString(), loanTerm)
      await poolGroup.repayLoanToPool(index, amount.toString(), loanTerm)

      const pool = await poolGroup.poolsById(poolId)
      assert.equal(pool.loanableAmount, amount)
      assert.equal((await poolGroup.totalRepaid()), amount)
      assert.equal((await poolGroup.totalRepaidPerTerm(loanTerm)), amount)
    })
  })
})
