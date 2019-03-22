const PoolGroup = artifacts.require('PoolGroup')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('PoolGroup', () => {
  describe('repayLoan', () => {
    describe('when amount is not more than totalLoan', () => {
      it('succeeds', async () => {
        const poolGroup = await PoolGroup.new(7)
        const term = 1
        const amount = 100e18
        await poolGroup.addToOneTimeDeposit(term, amount.toString())
        const poolIndex = await poolGroup.getPoolIndexByTerm(term)

        await poolGroup.loan(term, amount.toString())
        await poolGroup.repayLoan(term, amount.toString())

        const pool = await poolGroup.pools(poolIndex)
        assert.equal(pool.loanableAmount, amount)
        assert.equal((await poolGroup.totalLoan()), 0)
      })
    })

    describe('when amount is more than totalLoan', () => {
      it('reverts', async () => {
        const poolGroup = await PoolGroup.new(7)
        const term = 1
        const amount = 100e18
        await poolGroup.addToOneTimeDeposit(term, amount.toString())
        await poolGroup.loan(term, amount.toString())

        await shouldFail.reverting(
          poolGroup.repayLoan(term, 101e18.toString())
        )
      })
    })
  })
})
