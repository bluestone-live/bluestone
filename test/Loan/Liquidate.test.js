const Loan = artifacts.require('Loan')
const { shouldFail, time, BN } = require('openzeppelin-test-helpers')

contract('Loan', ([owner, anotherAccount]) => {
  const term = 7
  const loanAmount = 100e18.toString()
  const collateralAmount = 120e18.toString()
  const interestRate = 5e10.toString()
  const minCollateralRatio = 15e17.toString()
  const liquidationDiscount = 5e16.toString()
  const assetPrice = 100e18.toString()
  const collateralPrice = 100e18.toString()

  describe('#liquidate', () => {
    let loan

    beforeEach(async () => {
      loan = await Loan.new(
        owner, 
        term, 
        loanAmount, 
        collateralAmount, 
        interestRate,
        minCollateralRatio,
        liquidationDiscount
      )
    })

    describe('when requested amount is more than remaining debt', () => {
      it('reverts', async () => {
        await shouldFail.reverting(
          loan.liquidate(101e18.toString(), assetPrice, collateralPrice)        
        )
      })
    })

    describe('when requested amount is not more than remaining debt', () => {
      describe('when liquidates in full', async () => {
        it('returns freed collateral', async () => {
          const res = await loan.liquidate.call(new BN(-1), assetPrice, collateralPrice) 
          assert.isTrue(res[2] > 0)
        })

        it('liquidates in full', async () => {
          await loan.liquidate(new BN(-1), assetPrice, collateralPrice)
          assert.equal((await loan.isClosed()), true)
          assert.equal((await loan.remainingDebt()), 0) 
        })
      })

      describe('when not liquidates in full', async () => {
        it('does not return freed collateral', async () => {
          const res = await loan.liquidate.call(5e18.toString(), assetPrice, collateralPrice) 
          assert.equal(res[2], 0)
        })
      })

      describe('when liquidates multiple times', async () => {
        it('succeeds', async () => {
          const requestedAmount = 5e18.toString()
          await loan.liquidate(requestedAmount, assetPrice, collateralPrice)
          assert.equal((await loan.isClosed()), false)
          assert.equal((await loan.liquidatedAmount()), requestedAmount) 

          // Use precise value here since the output of (5 * 100 / 100 / 0.95 * 1e18) is not accurate
          // TODO: use BigNumber
          assert.equal((await loan.soldCollateralAmount()), 5263157894736842105)

          await time.increase(60 * 60 * 24)

          await loan.liquidate(new BN(-1), assetPrice, collateralPrice)
          assert.equal((await loan.isClosed()), true)
          assert.isTrue((await loan.liquidatedAmount()) - (await loan.loanAmount()) > 0)
          assert.equal((await loan.remainingDebt()), 0) 
        })
      })
    })
  })
})
