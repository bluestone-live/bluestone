const PoolGroup = artifacts.require('PoolGroup')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('PoolGroup', () => {
  describe('repayLoanToPool', () => {
    describe('when amount is not more than totalLoan', () => {
      it('succeeds', async () => {
        const poolGroup = await PoolGroup.new(7)
        const index = 0
        const amount = 100e18
        await poolGroup.addOneTimeDepositToPool(index, amount.toString())
        const poolId = await poolGroup.poolIds(index)

        await poolGroup.loanFromPool(index, amount.toString())
        await poolGroup.repayLoanToPool(index, amount.toString())

        const pool = await poolGroup.poolsById(poolId)
        assert.equal(pool.loanableAmount, amount)
        assert.equal((await poolGroup.totalLoan()), 0)
      })
    })

    describe('when amount is more than totalLoan', () => {
      it('reverts', async () => {
        const poolGroup = await PoolGroup.new(7)
        const index = 0
        const amount = 100e18
        await poolGroup.addOneTimeDepositToPool(index, amount.toString())
        await poolGroup.loanFromPool(index, amount.toString())

        await shouldFail.reverting(
          poolGroup.repayLoanToPool(index, 101e18.toString())
        )
      })
    })
  })
})
