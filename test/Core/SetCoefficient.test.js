const Core = artifacts.require('Core')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Core', function([owner, anotherAccount]) {
  let core

  beforeEach(async () => {
    core = await Core.new()
  })

  describe('setCoefficient', () => {
    const depositTerm = 7
    const loanTerm = 1
    const value = 5e17

    describe('when called by owner', () => {
      it('succeeds', async () => {
        await core.setCoefficient(depositTerm, loanTerm, value.toString(), { from: owner })
        assert.equal((await core.coefficients.call(depositTerm, loanTerm)), value)
      })
    })

    describe('when not called by owner', () => {
      it('reverts', async () => {
        await shouldFail.reverting(
          core.setCoefficient(depositTerm, loanTerm, value.toString(), { from: anotherAccount })
        )
      })
    })
  })
})
