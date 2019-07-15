const DepositManager = artifacts.require('DepositManagerMock')
const Configuration = artifacts.require('Configuration')
const PriceOracle = artifacts.require('PriceOracle')
const TokenManager = artifacts.require('TokenManager')
const LiquidityPools = artifacts.require('LiquidityPools')
const LoanManager = artifacts.require('LoanManager')
const DateTime = artifacts.require('DateTime')
const { time } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../../utils/index.js')
const { expect } = require('chai')

contract('DepositManager', ([owner, depositor, loaner]) => {
  let depositManager, config, priceOracle, tokenManager, liquidityPools, loanManager, datetime
  let loanAsset, collateralAsset
  const initialSupply = toFixedBN(3000)
  const depositAmount = toFixedBN(1000)
  const loanInterestRate1 = toFixedBN(1, 10)
  const loanInterestRate30 = toFixedBN(3, 10)
  const a11 = toFixedBN(0.4)
  const a301 = toFixedBN(0.6)
  const a3030 = toFixedBN(1)

  before(async () => {
    config = await Configuration.deployed()
    priceOracle = await PriceOracle.deployed()
    tokenManager = await TokenManager.deployed()
    liquidityPools = await LiquidityPools.deployed()
    depositManager = await DepositManager.new(
      config.address,
      priceOracle.address,
      tokenManager.address,
      liquidityPools.address
    ) 
    loanManager = await LoanManager.new(
      config.address,
      priceOracle.address,
      tokenManager.address,
      liquidityPools.address,
      depositManager.address
    )
    datetime = await DateTime.new()
    loanAsset = await createERC20Token(depositor, initialSupply)
    collateralAsset = await createERC20Token(loaner, initialSupply)
    await loanAsset.approve(tokenManager.address, initialSupply, { from: depositor })
    await collateralAsset.approve(tokenManager.address, initialSupply, { from: loaner })

    await depositManager.enableDepositAsset(loanAsset.address, { from: owner })
    await loanManager.enableLoanAssetPair(loanAsset.address, collateralAsset.address, { from: owner })

    await priceOracle.setPrice(loanAsset.address, toFixedBN(10))
    await priceOracle.setPrice(collateralAsset.address, toFixedBN(10))

    await config.setLoanInterestRate(loanAsset.address, 1, loanInterestRate1)
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

    before(async () => {
      await depositManager.deposit(loanAsset.address, 1, depositAmount, false, { from: depositor })
      await depositManager.deposit(loanAsset.address, 30, depositAmount, false, { from: depositor })
    })

    context('before any loan is made', () => {
      it('calculates interest rate to be 0', async () => {
        expect(await depositManager.calculateInterestRate(loanAsset.address, 1)).to.be.bignumber.equal('0')
        expect(await depositManager.calculateInterestRate(loanAsset.address, 30)).to.be.bignumber.equal('0')
      })
    })

    context('after 1-day loan is made', () => {
      const term = 1

      before(async () => {
        await loanManager.loan(
          term, 
          loanAsset.address,
          collateralAsset.address,
          loanAmount,
          collateralAmount,
          0,
          { from: loaner }
        )
      })

      it('calculates using: rs1 = (mb1 * rb1 * a11) / s1', async () => {
        const mb1 = loanAmount.mul(a11).div(toFixedBN(1))
        const rb1 = loanInterestRate1
        const s1 = depositAmount.sub(mb1)
        const expectedInterestRate = mb1.mul(rb1).mul(a11).div(s1).div(toFixedBN(1))
        const actualInterestRate = await depositManager.calculateInterestRate(loanAsset.address, term)
        expect(actualInterestRate).to.be.bignumber.equal(expectedInterestRate)
      })
    })

    context('after 30-day loan is made', () => {
      const term = 30

      before(async () => {
        await loanManager.loan(
          term, 
          loanAsset.address,
          collateralAsset.address,
          loanAmount,
          collateralAmount,
          0,
          { from: loaner }
        )
      })

      it('calculates using: rs30 = (mb1 * rb1 * a301 + mb30 * rb30 * a3030) / s30', async () => {
        const mb1 = loanAmount.mul(a11).div(toFixedBN(1))
        const rb1 = loanInterestRate1 
        const mb30 = loanAmount.mul(a301).add(loanAmount.mul(a3030)).div(toFixedBN(1))
        const rb30 = loanInterestRate30
        const s30 = depositAmount.sub(mb30)
        const expectedInterestRate = mb1.mul(rb1).mul(a301)
          .add(mb30.mul(rb30).mul(a3030))
          .div(s30)
          .div(toFixedBN(1))
        const actualInterestRate = await depositManager.calculateInterestRate(loanAsset.address, term)
        expect(actualInterestRate).to.be.bignumber.equal(expectedInterestRate)
      })
    })

    context('when 1-day deposit is matured', () => {
      before(async () => {
        const now = await time.latest()
        const secondsUntilMidnight = await datetime.secondsUntilMidnight(now)

        // At the first midnight, update interest index
        await time.increase(secondsUntilMidnight)        
        await depositManager.updateInterestIndexHistories(loanAsset.address, { from: owner })

        // At the second midnight, update interest index
        await time.increase(time.duration.days(1))
        depositManager.updateInterestIndexHistories(loanAsset.address, { from: owner })

        // Pass through the second midnight
        await time.increase(time.duration.hours(1))
      })

      it('withdraws deposit and interest', async () => {
        const deposit = await depositManager.deposits.call(0)
        const amount = await depositManager.withdraw.call(deposit, { from: depositor })
        expect(amount).to.be.bignumber.above(depositAmount)
      })
    })

    context('when 30-day deposit is overdue', () => {
      before(async () => {
        await time.increase(time.duration.days(70))
      }) 

      it('withdraws deposit only', async () => {
        const deposit = await depositManager.deposits.call(1)
        const amount = await depositManager.withdraw.call(deposit, { from: depositor })
        expect(amount).to.be.bignumber.equal(depositAmount)
      })
    })
  })
})
