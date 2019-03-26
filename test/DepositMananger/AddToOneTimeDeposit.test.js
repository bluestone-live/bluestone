const DepositManager = artifacts.require('DepositManagerMock')
const Deposit = artifacts.require('Deposit')
const LiquidityPools = artifacts.require('LiquidityPools')

contract('DepositManager', ([owner]) => {
  let manager

  describe('addToOneTimeDeposit', () => {
    beforeEach(async () => {
      let liquidityPools = await LiquidityPools.new()
      manager = await DepositManager.new(liquidityPools.address)
    })

    it('succeeds to add to one-time deposit', async () => {
      const term = 1
      const amount = 100e18
      await manager.addToOneTimeDeposit(owner, term, amount.toString())
      const depositId = 0
      const depositAddress = await manager.deposits(depositId)
      const deposit = await Deposit.at(depositAddress)

      assert.equal((await deposit.owner()), owner)
      assert.equal((await deposit.term()), term)
      assert.equal((await deposit.amount()), amount.toString())
      assert.equal((await deposit.isRecurring()), false)
    })
  })
})

