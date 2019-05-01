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

  describe('#withdrawDepositAndInterest', () => {
    const term = 1
    const isRecurring = false
    let deposit

    beforeEach(async () => {
      deposit = await Deposit.new(owner, term, amount, interestIndex, isRecurring)
    })

    it('succeeds', async () => {
      await deposit.withdrawDepositAndInterest(toFixedBN(2)) 
      expect(await deposit.isWithdrawn()).to.be.true
      expect(await deposit.withdrewAmount()).to.be.bignumber.above(amount)
    })       
  })

  describe('#withdrawDeposit', () => {
    const term = 1
    const isRecurring = false
    let deposit

    beforeEach(async () => {
      deposit = await Deposit.new(owner, term, amount, interestIndex, isRecurring)
    })

    it('succeeds', async () => {
      await deposit.withdrawDeposit() 
      expect(await deposit.isWithdrawn()).to.be.true
      expect(await deposit.withdrewAmount()).to.be.bignumber.equal(amount)
    })       
  })       
})

