const DepositManager = artifacts.require('DepositManager')
const Deposit = artifacts.require('Deposit')

contract('DepositManager', ([owner]) => {
  let manager

  describe('enableRecurringDeposit', () => {
    beforeEach(async () => {
      manager = await DepositManager.new()
    })

    it('succeeds to enable recurring deposit', async () => {
      const term = 1
      const amount = 100e18
      await manager.addToOneTimeDeposit(owner, term, amount.toString())

      const depositId = 0
      const depositAddress = await manager.deposits(depositId)
      const deposit = await Deposit.at(depositAddress)

      assert.equal((await deposit.isRecurring()), false)

      await manager.enableRecurringDeposit(owner, depositId)

      assert.equal((await deposit.isRecurring()), true)
    })
  })
})

