const Deposit = artifacts.require('Deposit')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Deposit', () => {
  const { address } = web3.eth.accounts.create()
  const amount = 100e18.toString()
  const interestIndex = 10e18.toString()

  describe('withdraw', () => {
    it('succeeds to withdraw if matured', async () => {
      const deposit = await Deposit.new(address, 0, amount, interestIndex, false)
      await deposit.withdraw(address, interestIndex) 
      assert.equal((await deposit.isWithdrawn()), true)
    })

    it('fails to withdraw if not matured', async () => {
      const deposit = await Deposit.new(address, 1, amount, interestIndex, false)
      await shouldFail.reverting(deposit.withdraw(address, interestIndex))
    })

    it('fails to withdraw if not by owner', async () => {
      const deposit = await Deposit.new(address, 1, amount, interestIndex, false)
      const { address: anotherAddress } = web3.eth.accounts.create()
      await shouldFail.reverting(deposit.withdraw(anotherAddress, interestIndex))
    })

    it('fails to withdraw if is recurring', async () => {
      const deposit = await Deposit.new(address, 0, amount, interestIndex, true)
      await shouldFail.reverting(deposit.withdraw(address, interestIndex))
    })

    it('fails to withdraw if is withdrawn', async () => {
      const deposit = await Deposit.new(address, 0, amount, interestIndex, false)
      await deposit.withdraw(address, interestIndex) 
      await shouldFail.reverting(deposit.withdraw(address, interestIndex))
    })
  })
})

