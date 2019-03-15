const Core = artifacts.require('Core')
const { fakeAssetAddresses } = require('../Utils.js')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Core', function([owner, ...accounts]) {
  let core
  const { ETH, DAI } = fakeAssetAddresses
  const term = 7
  const amount = 100e18.toString()
  const depositId = 0

  describe('enableRecurringDeposit', () => {
    beforeEach(async () => {
      core = await Core.new()
      await core.enableDepositManager(ETH, { from: owner })
      await core.deposit(ETH, term, amount, false)
    })

    it('succeeds to enable recurring deposit', async () => {
      await core.enableRecurringDeposit(ETH, depositId)
    })

    it('fails if deposit does not exsit', async () => { 
      await shouldFail.reverting(
        core.enableRecurringDeposit(ETH, 1)
      )
    })
  })
})
