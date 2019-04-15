const LoanManager = artifacts.require('LoanManager')
const DepositManager = artifacts.require('DepositManagerMock')
const Configuration = artifacts.require('ConfigurationMock')
const PriceOracle = artifacts.require('PriceOracle')
const LiquidityPools = artifacts.require('LiquidityPools')
const { shouldFail, BN } = require('openzeppelin-test-helpers')
const { createERC20Token } = require('../Utils.js')

contract('LoanManager', ([owner, anotherAccount]) => {
  const loanAmount = 100e18
  const collateralAmount = 300e18
  let loanManager, depositManager, configuration, priceOracle
  let asset, collateral

  before(async () => {
    configuration = await Configuration.new()
    priceOracle = await PriceOracle.new()
    asset = await createERC20Token(anotherAccount)
    collateral = await createERC20Token(anotherAccount)
  })

  describe('#repayLoan', () => {
    beforeEach(async () => {
      const liquidityPools = await LiquidityPools.new()

      loanManager = await LoanManager.new(
        asset.address, 
        collateral.address, 
        liquidityPools.address, 
        configuration.address, 
        priceOracle.address
      )

      depositManager = await DepositManager.new(liquidityPools.address)
    })

    describe('when repay in full', () => {
      const term = 1

      it('succeeds', async () => {
        await depositManager.addToOneTimeDeposit(owner, 1, 30e18.toString())
        await depositManager.addToOneTimeDeposit(owner, 7, 30e18.toString())
        await depositManager.addToOneTimeDeposit(owner, 30, 40e18.toString())

        await loanManager.loan(owner, term, loanAmount.toString(), collateralAmount.toString())

        const loanId = 0
        await loanManager.repayLoan(owner, loanId, new BN(-1))

        let pool1LoanableAmount = await depositManager.getLoanableAmountFromPool(1, 0) 
        let pool7LoanableAmount = await depositManager.getLoanableAmountFromPool(7, 6) 
        let pool30LoanableAmount = await depositManager.getLoanableAmountFromPool(30, 29) 

        assert.isTrue(pool1LoanableAmount.eq(pool7LoanableAmount))

        // Make sure loan interest is added to the loanableAmount of the pool
        assert.isTrue(pool7LoanableAmount.gt(30e18))
        assert.isTrue(pool30LoanableAmount.gt(40e18))
      })
    })

    describe('when repay multiple times', () => {
      const term = 7

      it('succeeds', async () => {
        await depositManager.addToOneTimeDeposit(owner, 7, 50e18.toString())
        await depositManager.addToOneTimeDeposit(owner, 30, 50e18.toString())

        await loanManager.loan(owner, term, loanAmount.toString(), collateralAmount.toString())

        const loanId = 0
        const firstRepayAmount = 50e18
        await loanManager.repayLoan(owner, loanId, firstRepayAmount.toString())

        let pool7LoanableAmount = await depositManager.getLoanableAmountFromPool(7, 6) 
        let pool30LoanableAmount = await depositManager.getLoanableAmountFromPool(30, 29) 
        assert.isTrue(pool7LoanableAmount.eq(pool30LoanableAmount))
        assert.isTrue(pool7LoanableAmount.gt(25e18))

        await loanManager.repayLoan(owner, loanId, new BN(-1))

        pool7LoanableAmount = await depositManager.getLoanableAmountFromPool(7, 6) 
        pool30LoanableAmount = await depositManager.getLoanableAmountFromPool(30, 29) 
        assert.isTrue(pool7LoanableAmount.eq(pool30LoanableAmount))
        assert.isTrue(pool7LoanableAmount.gt(50e18))
      })
    })
  })
})
