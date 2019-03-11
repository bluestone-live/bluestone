const DepositMarket = artifacts.require('DepositMarket')

contract('DepositMarket', () => {
  let market

  describe('addToOneTimeDeposit', () => {
    beforeEach(async () => {
      market = await DepositMarket.new()
    })

    it('succeeds to add to one-time deposit', async () => {
      let { address } = web3.eth.accounts.create()
      const term = 1
      const amount = 100e18
      await market.addToOneTimeDeposit(address, term, amount.toString())
      const depositId = 0
      const deposit = await market.deposits(depositId)

      assert.equal(deposit.user, address)
      assert.equal(deposit.term, term)
      assert.equal(deposit.amount, amount.toString())
      assert.equal(deposit.isRecurring, false)
    })
  })
})

