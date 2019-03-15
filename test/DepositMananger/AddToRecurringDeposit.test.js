const DepositManager = artifacts.require('DepositManager')
const Deposit = artifacts.require('Deposit')

contract('DepositManager', () => {
  let manager

  describe('addToRecurringDeposit', () => {
    beforeEach(async () => {
      manager = await DepositManager.new()
    })

    it('adds to recurring deposit', async () => {
      let { address } = web3.eth.accounts.create()
      const term = 1
      const amount = 100e18
      await manager.addToRecurringDeposit(address, term, amount.toString())
      const depositId = 0
      const depositAddress = await manager.deposits(depositId)
      const deposit = await Deposit.at(depositAddress)

      assert.equal((await deposit.owner()), address)
      assert.equal((await deposit.term()), term)
      assert.equal((await deposit.amount()), amount.toString())
      assert.equal((await deposit.isRecurring()), true)
    })
  })
})

