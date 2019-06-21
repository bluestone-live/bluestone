const Deposit = artifacts.require('Deposit')
const DateTime = artifacts.require('DateTime')
const { BN, shouldFail, time } = require('openzeppelin-test-helpers')
const { toFixedBN } = require('../../utils/index.js')
const { expect } = require('chai')

contract('Deposit', ([owner, anotherAccount]) => {
  const amount = toFixedBN(100)
  const interestIndex = toFixedBN(1)
  const profitRatio = toFixedBN(0.15)

  describe('#constructor', async () => {
    const term = new BN(7)
    const isRecurring = false
    let deposit, datetime, now, createdAt

    before(async () => {
      deposit = await Deposit.new(owner, term, amount, interestIndex, profitRatio, isRecurring)
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
      deposit = await Deposit.new(owner, term, amount, interestIndex, profitRatio, isRecurring)
    })

    it('succeeds', async () => {
      const currInterestIndex = toFixedBN(2)
      const { '0': withdrewAmount, '1': interestsForShareholders } = 
        await deposit.withdrawDepositAndInterest.call(currInterestIndex) 

      const expectedTotalInterests = amount.mul(currInterestIndex).div(interestIndex).sub(amount)
      const expectedInterestsForShareholder = expectedTotalInterests.mul(profitRatio).div(toFixedBN(1))
      const expectedInterestsForDepositor = expectedTotalInterests.sub(expectedInterestsForShareholder)
      const expectedWithdrewAmount = amount.add(expectedInterestsForDepositor)
      expect(withdrewAmount).to.be.bignumber.equal(expectedWithdrewAmount)
      expect(interestsForShareholders).to.be.bignumber.equal(expectedInterestsForShareholder)
    })       
  })

  describe('#withdrawDeposit', () => {
    const term = 1
    const isRecurring = false
    let deposit

    beforeEach(async () => {
      deposit = await Deposit.new(owner, term, amount, interestIndex, profitRatio, isRecurring)
    })

    it('succeeds', async () => {
      await deposit.withdrawDeposit() 
      expect(await deposit.isWithdrawn()).to.be.true
      expect(await deposit.withdrewAmount()).to.be.bignumber.equal(amount)
    })       
  })       
})

