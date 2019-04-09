const LoanManager = artifacts.require('LoanManager')
const DepositManager = artifacts.require('DepositManagerMock')
const Configuration = artifacts.require('ConfigurationMock')
const PriceOracle = artifacts.require('PriceOracle')
const LiquidityPools = artifacts.require('LiquidityPools')
const { shouldFail, BN } = require('openzeppelin-test-helpers')
const { createERC20Token, printLogs } = require('../Utils.js')

contract('LoanManager', ([owner, anotherAccount]) => {
  const depositAmount = 200e18
  const loanAmount = 100e18
  const collateralAmount = 300e18
  const collateralRatio = 15e17
  const liquidationDiscount = 5e16
  let liquidityPools, configuration, priceOracle
  let asset, collateral

  beforeEach(async () => {
    configuration = await Configuration.new()
    priceOracle = await PriceOracle.new()
    asset = await createERC20Token(anotherAccount)
    collateral = await createERC20Token(anotherAccount)
    liquidityPools = await LiquidityPools.new()

    configuration.setRiskParameters(
      asset.address, 
      collateral.address, 
      collateralRatio.toString(), 
      liquidationDiscount.toString()
    )
  })

  describe('liquidateLoan', () => {
    let loanManager, depositManager

    beforeEach(async () => {
      loanManager = await LoanManager.new(
        asset.address, 
        collateral.address, 
        liquidityPools.address, 
        configuration.address, 
        priceOracle.address
      )

      depositManager = await DepositManager.new(liquidityPools.address)
    })

    describe('when loan is undercollateralized', () => {
      beforeEach(async () => {
        await priceOracle.setPrice(asset.address, 300e18.toString())
        await priceOracle.setPrice(collateral.address, 100e18.toString())
      })

      it('liquidates in full', async () => {
        await depositManager.addToOneTimeDeposit(owner, 1, 30e18.toString())
        await depositManager.addToOneTimeDeposit(owner, 7, 30e18.toString())
        await depositManager.addToOneTimeDeposit(owner, 30, 40e18.toString())

        const term = 1
        await loanManager.loan(owner, term, loanAmount.toString(), collateralAmount.toString())

        const loanId = 0
        await loanManager.liquidateLoan(anotherAccount, loanId, new BN(-1))

        let pool1LoanableAmount = await depositManager.getLoanableAmountFromPool(1, 0) 
        let pool7LoanableAmount = await depositManager.getLoanableAmountFromPool(7, 6) 
        let pool30LoanableAmount = await depositManager.getLoanableAmountFromPool(30, 29) 

        assert.isTrue(pool1LoanableAmount.eq(pool7LoanableAmount))

        // Make sure loan interest is added to the loanableAmount of the pool
        assert.isTrue(pool7LoanableAmount.gt(30e18))
        assert.isTrue(pool30LoanableAmount.gt(40e18))
      })

      it('liquidates multiple times', async () => {
        await depositManager.addToOneTimeDeposit(owner, 7, 50e18.toString())
        await depositManager.addToOneTimeDeposit(owner, 30, 50e18.toString())

        const term = 7
        await loanManager.loan(owner, term, loanAmount.toString(), collateralAmount.toString())

        const loanId = 0
        const firstLiquidationAmount = 50e18
        await loanManager.liquidateLoan(anotherAccount, loanId, firstLiquidationAmount.toString())

        let pool7LoanableAmount = await depositManager.getLoanableAmountFromPool(7, 6) 
        let pool30LoanableAmount = await depositManager.getLoanableAmountFromPool(30, 29) 
        assert.isTrue(pool7LoanableAmount.eq(pool30LoanableAmount))
        assert.isTrue(pool7LoanableAmount.gt(25e18))

        await loanManager.liquidateLoan(anotherAccount, loanId, new BN(-1))

        pool7LoanableAmount = await depositManager.getLoanableAmountFromPool(7, 6) 
        pool30LoanableAmount = await depositManager.getLoanableAmountFromPool(30, 29) 
        assert.isTrue(pool7LoanableAmount.eq(pool30LoanableAmount))
        assert.isTrue(pool7LoanableAmount.gt(50e18))
      })
    })

    describe('when loan is not undercollateralized', () => {
      beforeEach(async () => {
        await priceOracle.setPrice(asset.address, 100e18.toString())
        await priceOracle.setPrice(collateral.address, 100e18.toString())
      })

      it('reverts', async () => {
        await depositManager.addToOneTimeDeposit(owner, 1, 30e18.toString())
        await depositManager.addToOneTimeDeposit(owner, 7, 30e18.toString())
        await depositManager.addToOneTimeDeposit(owner, 30, 40e18.toString())

        const term = 1
        await loanManager.loan(owner, term, loanAmount.toString(), collateralAmount.toString())

        const loanId = 0

        await shouldFail.reverting(
          loanManager.liquidateLoan(anotherAccount, loanId, new BN(-1))
        )
      })
    })
  })
})
