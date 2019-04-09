const Loan = artifacts.require('Loan')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Loan', ([owner, anotherAccount]) => {
  const term = 7
  const loanAmount = 100e18.toString()
  const collateralAmount = 300e18.toString()
  const interestRate = 5e16.toString()
  const minCollateralRatio = 15e17.toString()
  const liquidationDiscount = 5e16.toString()

  describe('setRecord', () => {
    it('succeeds', async () => {
      const loan = await Loan.new(
        owner, 
        term, 
        loanAmount, 
        collateralAmount, 
        interestRate, 
        minCollateralRatio, 
        liquidationDiscount
      )
      await loan.setRecord(7, 1, 70e18.toString()) 
      await loan.setRecord(7, 2, 30e18.toString())

      assert.equal((await loan.getRecord(7, 1)), 70e18.toString())
      assert.equal((await loan.getRecord(7, 2)), 30e18.toString())
    })
  })
})

