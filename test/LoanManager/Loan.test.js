const LoanManager = artifacts.require('LoanManager')
const DepositManager = artifacts.require('DepositManagerMock')
const Configuration = artifacts.require('ConfigurationMock')
const LiquidityPools = artifacts.require('LiquidityPools')

contract('LoanManager', ([owner, anotherAccount]) => {
  const term = 7
  const depositAmount = 200e18
  const loanAmount = 100e18
  const collateralAmount = 300e18
  let loanManager, depositManager, liquidityPools

  beforeEach(async () => {
    const configuration = await Configuration.new()
    liquidityPools = await LiquidityPools.new()
    loanManager = await LoanManager.new(liquidityPools.address, configuration.address)
    depositManager = await DepositManager.new(liquidityPools.address)
  })

  describe('loan', () => {
    describe('when there is enough deposit for loan', () => {
      it('succeeds', async () => {
        await depositManager.addToOneTimeDeposit(owner, 7, depositAmount.toString())
        await depositManager.addToOneTimeDeposit(owner, 30, depositAmount.toString())

        assert.equal((await depositManager.getLoanableAmountFromPool(7, 6)), depositAmount.toString())
        assert.equal((await depositManager.getLoanableAmountFromPool(30, 29)), depositAmount.toString())

        await loanManager.loan(owner, term, loanAmount.toString(), collateralAmount.toString())

        // 200e18 - 100e18 * 0.5 = 150e18
        assert.equal((await depositManager.getLoanableAmountFromPool(7, 6)), 150e18.toString())
        assert.equal((await depositManager.getLoanableAmountFromPool(30, 29)), 150e18.toString())
      })
    })

    // TODO: it fails when there is not enough deposit for loan
  })
})


