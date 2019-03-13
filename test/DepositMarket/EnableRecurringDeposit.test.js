const DepositMarket = artifacts.require('DepositMarket')
const Deposit = artifacts.require('Deposit')

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
      const depositAddress = await market.deposits(depositId)
      const deposit = await Deposit.at(depositAddress)

      assert.equal((await deposit.isRecurring()), false)

      await market.enableRecurringDeposit(address, depositId)

      assert.equal((await deposit.isRecurring()), true)
    })
  })
})

