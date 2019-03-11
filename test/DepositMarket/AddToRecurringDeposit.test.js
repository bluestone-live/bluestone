const DepositMarket = artifacts.require('DepositMarket')

contract('DepositMarket', () => {
  let market

  describe('addToRecurringDeposit', () => {
    beforeEach(async () => {
      market = await DepositMarket.new()
    })

    it('adds to recurring deposit', async () => {
      let { address } = web3.eth.accounts.create()
      const term = 1
      const amount = 100e18
      await market.addToRecurringDeposit(address, term, amount.toString())
      const depositId = 0
      const deposit = await market.deposits(depositId)

      assert.equal(deposit.user, address)
      assert.equal(deposit.term, term)
      assert.equal(deposit.amount, amount.toString())
      assert.equal(deposit.isRecurring, true)
    })
  })
})

