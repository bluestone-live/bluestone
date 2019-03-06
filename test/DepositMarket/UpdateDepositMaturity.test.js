const DepositMarket = artifacts.require('DepositMarket')

contract('DepositMarket', () => {
  let market

  describe('updateDepositMaturity', () => {
    beforeEach(async () => {
      market = await DepositMarket.new()
    })

    it('updates deposit maturity for 1-day-term pool groups', async () => {
      const term = 1
      const oneTimeDeposit = 100e18
      const recurringDeposit = 50e18
      const { address } = web3.eth.accounts.create()
      await market.addToOneTimeDeposit(address, term, oneTimeDeposit.toString())
      await market.addToRecurringDeposit(address, term, recurringDeposit.toString())

      const prevOneTimeDeposit = await market.getOneTimeDepositFromPool(term, 1)
      const prevRecurringDeposit = await market.getRecurringDepositFromPool(term, 1)
      assert.equal(prevOneTimeDeposit, oneTimeDeposit)
      assert.equal(prevRecurringDeposit, recurringDeposit)

      const prevMaturedDepositAmount = await market.maturedDepositAmount()
      assert.equal(prevMaturedDepositAmount, 0)

      await market.updateDepositMaturity()

      const currOneTimeDeposit = await market.getOneTimeDepositFromPool(term, 1)
      const currRecurringDeposit = await market.getRecurringDepositFromPool(term, 1)
      assert.equal(currOneTimeDeposit, 0)
      assert.equal(currRecurringDeposit, recurringDeposit)

      const currMaturedDepositAmount = await market.maturedDepositAmount()
      assert.equal(currMaturedDepositAmount, oneTimeDeposit)
    })

    it('updates deposit maturity for 7-day-term pool groups', async () => {
      const term = 7
      const oneTimeDeposit = 100e18
      const recurringDeposit = 50e18
      const { address } = web3.eth.accounts.create()
      await market.addToOneTimeDeposit(address, term, oneTimeDeposit.toString())
      await market.addToRecurringDeposit(address, term, recurringDeposit.toString())

      for (let i = 0; i < term; i++) {
        // Verify that deposits are moving forward each day
        const prevOneTimeDeposit = await market.getOneTimeDepositFromPool(term, term - i)
        const prevRecurringDeposit = await market.getRecurringDepositFromPool(term, term - i)
        assert.equal(prevOneTimeDeposit, oneTimeDeposit)
        assert.equal(prevRecurringDeposit, recurringDeposit)

        const prevMaturedDepositAmount = await market.maturedDepositAmount()
        assert.equal(prevMaturedDepositAmount, 0)

        await market.updateDepositMaturity()
      }

      const currOneTimeDeposit = await market.getOneTimeDepositFromPool(term, 7)
      const currRecurringDeposit = await market.getRecurringDepositFromPool(term, 7)
      assert.equal(currOneTimeDeposit, 0)
      assert.equal(currRecurringDeposit, recurringDeposit)

      const currMaturedDepositAmount = await market.maturedDepositAmount()
      assert.equal(currMaturedDepositAmount, oneTimeDeposit)
    })
  })
})
