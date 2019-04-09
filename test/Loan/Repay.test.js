const Loan = artifacts.require('Loan')
const { shouldFail, time, BN } = require('openzeppelin-test-helpers')

// time.increase() may not guarantee exact block time, use this 
// interest error to tolerate small fluctuations in time
const ACCEPTABLE_INTEREST_ERROR = 1e14 // 0.0001

contract('Loan', ([owner, anotherAccount]) => {
  const term = 7
  const loanAmount = 100e18
  const collateralAmount = 300e18
  const interestRate = 5e10
  const minCollateralRatio = 15e17
  const liquidationDiscount = 5e16
  let loan

  beforeEach(async () => {
    loan = await Loan.new(
      owner, 
      term, 
      loanAmount.toString(), 
      collateralAmount.toString(), 
      interestRate.toString(),
      minCollateralRatio.toString(),
      liquidationDiscount.toString()
    )
  })

  describe('repay', () => {
    describe('when amount is more than remaining debt', () => {
      it('fails', async () => {
        await shouldFail.reverting(
          loan.repay(101e18.toString())        
        )
      })
    })

    describe('when amount is not more than remaining debt', () => {
      it('repays multiple times', async () => {
        const twoDays = 2 * 24 * 60 * 60
        await time.increase(twoDays) 

        // TODO: refactor using BigNumber library
        let accruedInterest = loanAmount * interestRate * twoDays / 1e18 
        assert.isBelow((await loan.accruedInterest()) - accruedInterest, ACCEPTABLE_INTEREST_ERROR);

        await time.increase(twoDays) 

        accruedInterest = loanAmount * interestRate * twoDays * 2 / 1e18
        assert.isBelow((await loan.accruedInterest()) - accruedInterest, ACCEPTABLE_INTEREST_ERROR);

        const repayAmount = 50e18

        await loan.repay(repayAmount.toString())
        assert.equal((await loan.alreadyPaidAmount()), repayAmount.toString());

        const threeDays = 3 * 24 * 60 * 60
        await time.increase(threeDays)

        await loan.repay(new BN(-1))

        accruedInterest += (loanAmount + accruedInterest - repayAmount) * interestRate * threeDays / 1e18   
        assert.isBelow((await loan.accruedInterest()) - accruedInterest, ACCEPTABLE_INTEREST_ERROR);
        assert.isTrue((await loan.isClosed()));
      })
    })
  })
})

