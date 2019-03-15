const DepositManager = artifacts.require('DepositManager')
const Deposit = artifacts.require('Deposit')

contract('DepositManager', () => {
  let manager

  describe('enableRecurringDeposit', () => {
    beforeEach(async () => {
      manager = await DepositManager.new()
    })

    it('succeeds to enable recurring deposit', async () => {
      let { address } = web3.eth.accounts.create()
      const term = 1
      const amount = 100e18
      await manager.addToOneTimeDeposit(address, term, amount.toString())

      const depositId = 0
      const depositAddress = await manager.deposits(depositId)
      const deposit = await Deposit.at(depositAddress)

      assert.equal((await deposit.isRecurring()), false)

      await manager.enableRecurringDeposit(address, depositId)

      assert.equal((await deposit.isRecurring()), true)
    })
  })
})

