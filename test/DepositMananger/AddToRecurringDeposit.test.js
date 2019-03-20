const DepositManager = artifacts.require('DepositManager')
const Deposit = artifacts.require('Deposit')
const LiquidityPools = artifacts.require('LiquidityPools')

contract('DepositManager', ([owner]) => {
  let manager

  describe('addToRecurringDeposit', () => {
    beforeEach(async () => {
      let liquidityPools = await LiquidityPools.new()
      manager = await DepositManager.new(liquidityPools.address)
    })

    it('adds to recurring deposit', async () => {
      const term = 1
      const amount = 100e18
      await manager.addToRecurringDeposit(owner, term, amount.toString())
      const depositId = 0
      const depositAddress = await manager.deposits(depositId)
      const deposit = await Deposit.at(depositAddress)

      assert.equal((await deposit.owner()), owner)
      assert.equal((await deposit.term()), term)
      assert.equal((await deposit.amount()), amount.toString())
      assert.equal((await deposit.isRecurring()), true)
    })
  })
})

