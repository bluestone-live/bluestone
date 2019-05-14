const Loan = artifacts.require('Loan')
const { shouldFail, time, BN } = require('openzeppelin-test-helpers')
const { toFixedBN } = require('../../utils/index.js')
const { expect } = require('chai')

contract('Loan', ([owner, anotherAccount]) => {
  const term = 7
  const loanAmount = toFixedBN(100)
  const collateralAmount = toFixedBN(300)
  const interestRate = toFixedBN(5, 10)
  const minCollateralRatio = toFixedBN(1.5)
  const liquidationDiscount = toFixedBN(0.05)

  const createLoan = async () => {
      return await Loan.new(
        owner, 
        term, 
        loanAmount, 
        collateralAmount, 
        interestRate, 
        minCollateralRatio, 
        liquidationDiscount
      )
  }

  let loan

  describe('#setRecord', () => {
    before(async () => loan = await createLoan())

    it('succeeds', async () => {
      const amount = toFixedBN(70)
      await loan.setRecord(7, 1, amount) 
      expect(await loan.getRecord(7, 1)).to.be.bignumber.equal(amount)
    })
  })

  describe('#accuredInterest', () => {
    before(async () => loan = await createLoan())

    it('generates interest', async () => {
      const twoDays = time.duration.days(2)
      await time.increase(twoDays)        
      
      const accruedInterest = loanAmount.mul(interestRate).mul(twoDays).div(toFixedBN(1))

      // time.increase() may not guarantee exact block time, use this 
      // interest error to tolerate small fluctuations in time
      const acceptableInterestError = toFixedBN(1, 14) // 0.0001

      expect(await loan.accruedInterest())
        .to.be.bignumber
        .closeTo(accruedInterest, acceptableInterestError)
    })
  })

  describe('#repay', () => {
    before(async () => loan = await createLoan())

    context('when repay amount is more than remaining debt', () => {
      it('reverts', async () => {
        await shouldFail.reverting(
          loan.repay(toFixedBN(101))        
        )
      })
    })

    context('1. partial repay', () => {
      const repayAmount = toFixedBN(50)

      it('does not return freed collateral', async () => {
        const res = await loan.repay.call(repayAmount)    
        expect(res[1]).to.be.bignumber.equal('0')
      })

      it('repays in partial', async () => {
        await loan.repay(repayAmount)
      })

      it('updates alreadyPaidAmount', async () => {
        expect(await loan.alreadyPaidAmount()).to.be.bignumber.equal(repayAmount)
      })

      it('does not close the loan', async () => {
        expect(await loan.isClosed()).to.be.false
      })
    })

    context('2. full repay', () => {
      it('returns freed collateral', async () => {
        const res = await loan.repay.call('-1')    
        expect(res[1]).to.be.bignumber.equal(collateralAmount)
      })

      it('repays in full', async () => {
        await loan.repay('-1')
      })

      it('closes the loan', async () => {
        expect(await loan.isClosed()).to.be.true
      })
    })
  })

  describe('#liquidate', () => {
    before(async () => loan = await createLoan())

    const assetPrice = toFixedBN(100)
    const collateralPrice = toFixedBN(100)
    
    context('when liquidate amount is more than remaining debt', () => {
      it('reverts', async () => {
        await shouldFail.reverting(
          loan.liquidate(toFixedBN(101), assetPrice, collateralPrice)        
        )
      })
    })

    context('1. partial liquidate', () => {
      const requestedAmount = toFixedBN(50)

      it('liquidates in partial', async () => {
        await loan.liquidate(requestedAmount, assetPrice, collateralPrice)
      })

      it('updates liquidatedAmount', async () => {
        expect(await loan.liquidatedAmount()).to.be.bignumber.equal(requestedAmount)
      })

      it('updates soldCollateralAmount', async () => {
        const soldCollateralAmount = toFixedBN(50).mul(new BN(100)).div(new BN(95))
        expect(await loan.soldCollateralAmount()).to.be.bignumber.equal(soldCollateralAmount)
      })

      it('does not close the loan', async () => {
        expect(await loan.isClosed()).to.be.false
      })
    })

    context('2. full liquidate after one day', () => {
      before(async () => {
        await time.increase(time.duration.days(1))
      })

      it('liquidates in full', async () => {
        await loan.liquidate('-1', assetPrice, collateralPrice)
      })

      it('updates liquidatedAmount', async () => {
        expect(await loan.liquidatedAmount()).to.be.bignumber.above(loanAmount)
      })

      it('has no remaining debt', async () => {
        expect(await loan.remainingDebt()).to.be.bignumber.equal('0')
      })

      it('closes the loan', async () => {
        expect(await loan.isClosed()).to.be.true
      })
    })
  })
})
