const Deposit = artifacts.require('Deposit')
const { shouldFail, time } = require('openzeppelin-test-helpers')
const { toFixedBN } = require('../Utils.js')
const { expect } = require('chai')

contract('Deposit', ([owner, anotherAccount]) => {
  const amount = toFixedBN(100)
  const interestIndex = toFixedBN(1)

  describe('#withdraw', () => {
    const term = 1
    const isRecurring = false
    let deposit

    beforeEach(async () => {
      deposit = await Deposit.new(owner, term, amount, interestIndex, isRecurring)
    })

    context('when deposit is not matured', () => {
      it('reverts', async () => {
        await shouldFail.reverting(deposit.withdraw(owner, interestIndex))
      })       
    })

    context('when deposit is matured', () => {
      beforeEach(async () => {
        await time.increase(time.duration.hours(25))
      })

      it('succeeds', async () => {
        await deposit.withdraw(owner, interestIndex) 
        expect(await deposit.isWithdrawn()).to.be.true
      })       

      context('when deposit is recurring', () => {
        beforeEach(async () => {
          await deposit.enableRecurring()
        })

        it('reverts', async () => {
          await shouldFail.reverting(deposit.withdraw(owner, interestIndex))
        })       
      })

      context('when deposit has been withdrawn', () => {
        beforeEach(async () => {
          await deposit.withdraw(owner, interestIndex) 
        })

        it('reverts', async () => {
          await shouldFail.reverting(deposit.withdraw(owner, interestIndex))
        })       
      })
    })
  })
})

