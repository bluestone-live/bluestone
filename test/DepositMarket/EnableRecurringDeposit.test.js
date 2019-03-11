const DepositMarket = artifacts.require('DepositMarket')

contract('DepositMarket', () => {
  let market

  describe('enableRecurringDeposit', () => {
    beforeEach(async () => {
      market = await DepositMarket.new()
    })

    it('succeeds to enable recurring deposit', async () => {
      let { address } = web3.eth.accounts.create()
      const term = 1
      const amount = 100e18
      await market.addToOneTimeDeposit(address, term, amount.toString())

      const depositId = 0
      const prevDeposit = await market.deposits(depositId)
      assert.equal(prevDeposit.isRecurring, false)

      await market.enableRecurringDeposit(address, depositId)
      const currDeposit = await market.deposits(depositId)
      assert.equal(currDeposit.isRecurring, true)
    })
  })
})

