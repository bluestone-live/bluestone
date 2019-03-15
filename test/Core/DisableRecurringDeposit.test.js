const Core = artifacts.require('Core')
const { fakeAssetAddresses } = require('../Utils.js')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Core', function([owner, ...accounts]) {
  let core
  const { ETH, DAI } = fakeAssetAddresses
  const term = 7
  const amount = 100e18.toString()
  const depositId = 0

  describe('disableRecurringDeposit', () => {
    beforeEach(async () => {
      core = await Core.new()
      await core.enableDepositManager(ETH, { from: owner })
      await core.deposit(ETH, term, amount, true)
    })

    it('succeeds to disable recurring deposit', async () => {
      await core.disableRecurringDeposit(ETH, depositId)
    })

    it('fails if deposit does not exsit', async () => { 
      await shouldFail.reverting(
        core.disableRecurringDeposit(ETH, 1)
      )
    })
  })
})
