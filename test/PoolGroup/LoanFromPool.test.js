const PoolGroup = artifacts.require('PoolGroup')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('PoolGroup', () => {
  describe('loanFromPool', () => {
    describe('when loanable amount is enough', () => {
      it('succeeds', async () => {
        const poolGroup = await PoolGroup.new(7)
        const index = 0
        const amount = 100e18
        const loanTerm = 1
        await poolGroup.addOneTimeDepositToPool(index, amount.toString())
        const poolId = await poolGroup.poolIds(index)
        const prevPool = await poolGroup.poolsById(poolId)

        assert.equal(prevPool.loanableAmount, amount)
        assert.equal((await poolGroup.totalLoan()), 0)
        assert.equal((await poolGroup.totalLoanPerTerm(loanTerm)), 0)

        await poolGroup.loanFromPool(index, amount.toString(), loanTerm)

        const currPool = await poolGroup.poolsById(poolId)
        assert.equal(currPool.loanableAmount, 0)
        assert.equal((await poolGroup.totalLoan()), amount)
        assert.equal((await poolGroup.totalLoanPerTerm(loanTerm)), amount)
      })
    })

    describe('when loanable amount is not enough', () => {
      it('reverts', async () => {
        const poolGroup = await PoolGroup.new(7)
        const index = 0
        const amount = 100e18
        const loanTerm = 1
        await poolGroup.addOneTimeDepositToPool(index, amount.toString())

        await shouldFail.reverting(
          poolGroup.loanFromPool(index, 101e18.toString(), loanTerm)
        )
      })
    })
  })
})
