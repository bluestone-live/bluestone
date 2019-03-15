const Core = artifacts.require('Core')
const { fakeAssetAddresses } = require('../Utils.js')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Core', function([owner, ...accounts]) {
  let core
  const { ETH, DAI } = fakeAssetAddresses
  const term = 1
  const amount = 100e18.toString()

  describe('deposit', () => {
    beforeEach(async () => {
      core = await Core.new()
      await core.enableDepositManager(ETH, { from: owner })
    })

    it('succeeds to add one-time deposit', async () => {
      const isRecurring = false
      await core.deposit(ETH, term, amount, isRecurring)
    })

    it('succeeds to add recurring deposit', async () => {
      const isRecurring = true
      await core.deposit(ETH, term, amount, isRecurring)
    })

    it('fails to add deposit if the asset is not enabled', async () => {
      const isRecurring = false
      await shouldFail.reverting(
        core.deposit(DAI, term, amount, isRecurring)
      )
    })

    it('fails to add deposit if the term is invalid', async () => {
      const isRecurring = false
      await shouldFail.reverting(
        core.deposit(ETH, 11, amount, isRecurring)
      )
    })
  })
})
