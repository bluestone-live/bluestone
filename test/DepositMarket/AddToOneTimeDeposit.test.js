const DepositMarket = artifacts.require('DepositMarket')
const Deposit = artifacts.require('Deposit')

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
      const depositAddress = await market.deposits(depositId)
      const deposit = await Deposit.at(depositAddress)

      assert.equal((await deposit.owner()), address)
      assert.equal((await deposit.term()), term)
      assert.equal((await deposit.amount()), amount.toString())
      assert.equal((await deposit.isRecurring()), false)
    })
  })
})

