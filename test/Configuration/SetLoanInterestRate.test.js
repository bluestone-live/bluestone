const Configuration = artifacts.require('Configuration')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Configuration', function([owner, anotherAccount]) {
  let config

  beforeEach(async () => {
    config = await Configuration.new()
  })

  describe('setLoanInterestRate', () => {
    const loanTerm = 1
    const value = 5e16

    describe('when called by owner', () => {
      it('succeeds', async () => {
        await config.setLoanInterestRate(loanTerm, value.toString(), { from: owner })
        assert.equal((await config.getLoanInterestRate(loanTerm)), value)
      })
    })

    describe('when not called by owner', () => {
      it('reverts', async () => {
        await shouldFail.reverting(
          config.setLoanInterestRate(loanTerm, value.toString(), { from: anotherAccount })
        )
      })
    })
  })
})
