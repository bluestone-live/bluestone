const Configuration = artifacts.require('Configuration')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Configuration', function([owner, anotherAccount]) {
  let config

  beforeEach(async () => {
    config = await Configuration.new()
  })

  describe('setCoefficient', () => {
    const depositTerm = 7
    const loanTerm = 1
    const value = 5e17

    describe('when called by owner', () => {
      it('succeeds', async () => {
        await config.setCoefficient(depositTerm, loanTerm, value.toString(), { from: owner })
        assert.equal((await config.getCoefficient(depositTerm, loanTerm)), value)
      })
    })

    describe('when not called by owner', () => {
      it('reverts', async () => {
        await shouldFail.reverting(
          config.setCoefficient(depositTerm, loanTerm, value.toString(), { from: anotherAccount })
        )
      })
    })
  })
})
