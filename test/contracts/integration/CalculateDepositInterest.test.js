const Configuration = artifacts.require('Configuration')
const PriceOracle = artifacts.require('PriceOracle')
const TokenManager = artifacts.require('TokenManager')
const LiquidityPools = artifacts.require('LiquidityPools')
const Loan = artifacts.require('Loan')
const DateTime = artifacts.require('DateTime')
const { time } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../../utils/index.js')
const { DepositManagerMock, LoanManagerMock } = require('../../utils/mocks.js')
const { expect } = require('chai')

contract('DepositManager', ([owner, depositor, loaner]) => {
  let depositManager, config, priceOracle, tokenManager, liquidityPools, loanManager, datetime
  let loanAsset, collateralAsset
  const initialSupply = toFixedBN(3000)
  const depositAmount = toFixedBN(1000)
  const loanInterestRate30 = toFixedBN(0.05)
  const a11 = toFixedBN(0.4)
  const a301 = toFixedBN(0.6)
  const a3030 = toFixedBN(1)

  before(async () => {
    config = await Configuration.deployed()
    priceOracle = await PriceOracle.deployed()
    tokenManager = await TokenManager.deployed()
    liquidityPools = await LiquidityPools.deployed()
    depositManager = await DepositManagerMock()
    loanManager = await LoanManagerMock()
    datetime = await DateTime.new()
    loanAsset = await createERC20Token(depositor, initialSupply)
    collateralAsset = await createERC20Token(loaner, initialSupply)
    await loanAsset.mint(loaner, initialSupply)
    await loanAsset.approve(tokenManager.address, initialSupply, { from: depositor })
    await loanAsset.approve(tokenManager.address, initialSupply, { from: loaner })
    await collateralAsset.approve(tokenManager.address, initialSupply, { from: loaner })

    await depositManager.enableDepositAsset(loanAsset.address, { from: owner })
    await loanManager.enableLoanAssetPair(loanAsset.address, collateralAsset.address, { from: owner })

    await priceOracle.setPrice(loanAsset.address, toFixedBN(10))
    await priceOracle.setPrice(collateralAsset.address, toFixedBN(10))

    await config.setLoanInterestRate(loanAsset.address, 30, loanInterestRate30)

    const assetList = [loanAsset, collateralAsset]

    for (let i = 0; i < assetList.length; i++) {
      const asset = assetList[i]
      await config.setCoefficient(asset.address, 1, 1, a11)
      await config.setCoefficient(asset.address, 30, 1, a301)
      await config.setCoefficient(asset.address, 30, 30, a3030)
    }

    await config.setShareholderAddress(owner)
  })

  describe('calculate deposit interest', () => {
    const loanAmount = toFixedBN(100)
    const collateralAmount = toFixedBN(200)
    let loan

    before(async () => {
      const term = 30
      await depositManager.deposit(loanAsset.address, term, depositAmount, { from: depositor })
      await depositManager.deposit(loanAsset.address, term, depositAmount, { from: depositor })

      await loanManager.loan(
        term, 
        loanAsset.address,
        collateralAsset.address,
        loanAmount,
        collateralAmount,
        0,
        { from: loaner }
      )

      const loanAddress = await loanManager.loans.call(0);
      loan = await Loan.at(loanAddress)
      const repayAmount = await loan.remainingDebt()

      await loanManager.repayLoan(loanAddress, repayAmount, {
        from: loaner
      });
    })

    context('when 30-day deposit is matured', () => {
      before(async () => {
        for (let i = 0; i < 30; i++) {
          await depositManager.updateDepositMaturity(loanAsset.address, { from: owner })
        }

        await time.increase(time.duration.days(31))
      })

      it('withdraws deposit and interest', async () => {
        const deposit = await depositManager.deposits.call(0)
        const withdrewAmount = await depositManager.withdraw.call(deposit, { from: depositor })
        const loanInterest = await loan.interest()

        // There are 2 deposits in total
        const totalDeposit = depositAmount.add(depositAmount)
        const profitRatio = toFixedBN(0.15)

        const totalInterest = loanInterest
          .mul(depositAmount)
          .div(totalDeposit)

        const profitInterest = totalInterest.mul(profitRatio).div(toFixedBN(1))
        const depositInterest = totalInterest.sub(profitInterest)

        // It seems Solidity and bn.js handles rounding decimals differently, 
        // so there is a very tiny difference on the result.
        expect(withdrewAmount).to.be.bignumber.closeTo(
          depositAmount.add(depositInterest), 
          toFixedBN(0.00001)
        )
      })
    })

    context('when 30-day deposit is overdue', () => {
      before(async () => {
        await time.increase(time.duration.days(70))
      }) 

      it('withdraws deposit only', async () => {
        const deposit = await depositManager.deposits.call(0)
        const amount = await depositManager.withdraw.call(deposit, { from: depositor })
        expect(amount).to.be.bignumber.equal(depositAmount)
      })
    })
  })
})
