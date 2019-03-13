const Deposit = artifacts.require('Deposit')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Deposit', () => {
  const { address } = web3.eth.accounts.create()
  const amount = 100e18

  describe('withdraw', () => {
    it('succeeds to withdraw if matured', async () => {
      const deposit = await Deposit.new(address, 0, amount.toString(), false)
      await deposit.withdraw(address) 
      assert.equal((await deposit.isWithdrawn()), true)
    })

    it('fails to withdraw if not matured', async () => {
      const deposit = await Deposit.new(address, 1, amount.toString(), false)
      await shouldFail.reverting(deposit.withdraw(address))
    })

    it('fails to withdraw if not by owner', async () => {
      const deposit = await Deposit.new(address, 1, amount.toString(), false)
      const { address: anotherAddress } = web3.eth.accounts.create()
      await shouldFail.reverting(deposit.withdraw(anotherAddress))
    })

    it('fails to withdraw if is recurring', async () => {
      const deposit = await Deposit.new(address, 0, amount.toString(), true)
      await shouldFail.reverting(deposit.withdraw(address))
    })

    it('fails to withdraw if is withdrawn', async () => {
      const deposit = await Deposit.new(address, 0, amount.toString(), false)
      await deposit.withdraw(address) 
      await shouldFail.reverting(deposit.withdraw(address))
    })
  })
})

