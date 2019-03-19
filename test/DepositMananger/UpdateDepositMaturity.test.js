const DepositManager = artifacts.require('DepositManager')

contract('DepositManager', ([owner]) => {
  let manager

  describe('updateDepositMaturity', () => {
    beforeEach(async () => {
      manager = await DepositManager.new()
    })

    it('updates deposit maturity for 1-day-term pool groups', async () => {
      const term = 1
      const oneTimeDeposit = 100e18
      const recurringDeposit = 50e18
      await manager.addToOneTimeDeposit(owner, term, oneTimeDeposit.toString())
      await manager.addToRecurringDeposit(owner, term, recurringDeposit.toString())

      const prevOneTimeDeposit = await manager.getOneTimeDepositFromPool(term, 1)
      const prevRecurringDeposit = await manager.getRecurringDepositFromPool(term, 1)
      assert.equal(prevOneTimeDeposit, oneTimeDeposit)
      assert.equal(prevRecurringDeposit, recurringDeposit)

      await manager.updateDepositMaturity()

      const currOneTimeDeposit = await manager.getOneTimeDepositFromPool(term, 1)
      const currRecurringDeposit = await manager.getRecurringDepositFromPool(term, 1)
      assert.equal(currOneTimeDeposit, 0)
      assert.equal(currRecurringDeposit, recurringDeposit)
    })

    it('updates deposit maturity for 7-day-term pool groups', async () => {
      const term = 7
      const oneTimeDeposit = 100e18
      const recurringDeposit = 50e18
      await manager.addToOneTimeDeposit(owner, term, oneTimeDeposit.toString())
      await manager.addToRecurringDeposit(owner, term, recurringDeposit.toString())

      for (let i = 0; i < term; i++) {
        // Verify that deposits are moving forward each day
        const prevOneTimeDeposit = await manager.getOneTimeDepositFromPool(term, term - i)
        const prevRecurringDeposit = await manager.getRecurringDepositFromPool(term, term - i)
        assert.equal(prevOneTimeDeposit, oneTimeDeposit)
        assert.equal(prevRecurringDeposit, recurringDeposit)

        await manager.updateDepositMaturity()
      }

      const currOneTimeDeposit = await manager.getOneTimeDepositFromPool(term, 7)
      const currRecurringDeposit = await manager.getRecurringDepositFromPool(term, 7)
      assert.equal(currOneTimeDeposit, 0)
      assert.equal(currRecurringDeposit, recurringDeposit)
    })
  })
})
