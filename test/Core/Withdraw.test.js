const Core = artifacts.require('Core')
const { fakeAssetAddresses } = require('../Utils.js')
const { shouldFail, time } = require('openzeppelin-test-helpers')

contract('Core', function([owner, ...accounts]) {
  let core
  const { ETH, DAI } = fakeAssetAddresses
  const term = 1
  const amount = 100e18.toString()
  const depositId = 0

  describe('withdraw', () => {
    beforeEach(async () => {
      core = await Core.new()
      await core.enableDepositManager(ETH, { from: owner })
    })

    it('fails if not matured', async () => {
      const isRecurring = false
      await core.deposit(ETH, term, amount, isRecurring)
      const lessThanOneDay = 23 * 60 * 60
      await time.increase(lessThanOneDay)
      await shouldFail.reverting(
        core.withdraw(ETH, depositId)
      )
    })

    it('succeeds if matured', async () => {
      const isRecurring = false
      await core.deposit(ETH, term, amount, isRecurring)
      const oneDay = 24 * 60 * 60
      await time.increase(oneDay)
      await core.updateDepositMaturity(ETH)
      await core.withdraw(ETH, depositId)
    })
  })
})
