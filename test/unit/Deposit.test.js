const Deposit = artifacts.require('Deposit')
const DateTime = artifacts.require('DateTime')
const { BN, shouldFail, time } = require('openzeppelin-test-helpers')
const { toFixedBN } = require('../Utils.js')
const { expect } = require('chai')

contract('Deposit', ([owner, anotherAccount]) => {
  const amount = toFixedBN(100)
  const interestIndex = toFixedBN(1)

  describe('#constructor', async () => {
    const term = new BN(7)
    const isRecurring = false
    let deposit, datetime, now, createdAt

    before(async () => {
      deposit = await Deposit.new(owner, term, amount, interestIndex, isRecurring)
      now = await time.latest()
      datetime = await DateTime.new()
    })

    it('updates createdAt', async () => {
      createdAt = await deposit.createdAt()
      expect(createdAt).to.be.bignumber.closeTo(now, new BN(1))
    })

    it('updates maturedAt', async () => {
      const secondsUntilMidnight = await datetime.secondsUntilMidnight(now)      
      const dayInSeconds = new BN(86400)
      const maturedAt = createdAt.add(secondsUntilMidnight.add(term.mul(dayInSeconds)))
      expect(await deposit.maturedAt()).to.be.bignumber.equal(maturedAt)
    })
  })

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
        await time.increase(time.duration.days(2))
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

