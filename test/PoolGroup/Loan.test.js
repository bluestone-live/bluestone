const PoolGroup = artifacts.require('PoolGroup')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('PoolGroup', () => {
  describe('loan', () => {
    describe('when loanable amount is enough', () => {
      it('succeeds', async () => {
        const poolGroup = await PoolGroup.new(7)
        const term = 1
        const amount = 100e18
        await poolGroup.addToOneTimeDeposit(term, amount.toString())
        const poolIndex = await poolGroup.getPoolIndexByTerm(term)
        const prevPool = await poolGroup.pools(poolIndex)

        assert.equal(prevPool.loanableAmount, amount)
        assert.equal((await poolGroup.totalLoan()), 0)

        await poolGroup.loan(term, amount.toString())

        const currPool = await poolGroup.pools(poolIndex)
        assert.equal(currPool.loanableAmount, 0)
        assert.equal((await poolGroup.totalLoan()), amount)
      })
    })

    describe('when loanable amount is not enough', () => {
      it('reverts', async () => {
        const poolGroup = await PoolGroup.new(7)
        const term = 1
        const amount = 100e18
        await poolGroup.addToOneTimeDeposit(term, amount.toString())

        await shouldFail.reverting(
          poolGroup.loan(term, 101e18.toString())
        )
      })
    })
  })
})
