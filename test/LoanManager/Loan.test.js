const LoanManager = artifacts.require('LoanManager')
const DepositManager = artifacts.require('DepositManagerMock')
const Configuration = artifacts.require('ConfigurationMock')
const PriceOracle = artifacts.require('PriceOracle')
const LiquidityPools = artifacts.require('LiquidityPools')
const { createERC20Token } = require('../Utils.js')

contract('LoanManager', ([owner, anotherAccount]) => {
  const term = 7
  const depositAmount = 200e18
  const loanAmount = 100e18
  const collateralAmount = 300e18
  let loanManager, depositManager

  beforeEach(async () => {
    const configuration = await Configuration.new()
    const priceOracle = await PriceOracle.new()
    const asset = await createERC20Token(anotherAccount)
    const collateral = await createERC20Token(anotherAccount)
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


