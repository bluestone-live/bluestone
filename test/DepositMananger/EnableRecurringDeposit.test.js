const DepositManager = artifacts.require('DepositManager')
const Deposit = artifacts.require('Deposit')
const LiquidityPools = artifacts.require('LiquidityPools')

contract('DepositManager', ([owner]) => {
  let manager

  describe('enableRecurringDeposit', () => {
    beforeEach(async () => {
      let liquidityPools = await LiquidityPools.new()
      manager = await DepositManager.new(liquidityPools.address)
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

