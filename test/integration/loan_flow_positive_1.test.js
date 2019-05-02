const LoanManager = artifacts.require('LoanManager')
const DepositManager = artifacts.require('DepositManager')
const TokenManager = artifacts.require('TokenManager')
const PriceOracle = artifacts.require('PriceOracle')
const { shouldFail, BN, time } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../Utils.js')
const { expect } = require('chai')

contract('LoanManager', ([owner, depositor, loaner]) => {
  const initialSupply = toFixedBN(1000)
  let depositManager, loanManager, tokenManager

  before(async () => {
    depositManager = await DepositManager.deployed()
    loanManager = await LoanManager.deployed() 
    tokenManager = await TokenManager.deployed()
    priceOracle = await PriceOracle.deployed()
  })

  describe('loan flow positive #1', () => {
    const depositAmount = toFixedBN(100)
    let loanAsset, collateralAsset

    before(async () => {
      loanAsset = await createERC20Token(depositor, initialSupply)
      collateralAsset = await createERC20Token(loaner, initialSupply)
      await priceOracle.setPrice(loanAsset.address, toFixedBN(10))
      await priceOracle.setPrice(collateralAsset.address, toFixedBN(10))
      await loanAsset.approve(tokenManager.address, initialSupply, { from: depositor })
      await loanAsset.mint(loaner, initialSupply)
      await loanAsset.approve(tokenManager.address, initialSupply, { from: loaner })
      await collateralAsset.approve(tokenManager.address, initialSupply, { from: loaner })
      await depositManager.enableDepositAsset(loanAsset.address, { from: owner })
      await depositManager.deposit(loanAsset.address, 1, depositAmount, false, { from: depositor })
      await depositManager.deposit(loanAsset.address, 7, depositAmount, false, { from: depositor })
      await depositManager.deposit(loanAsset.address, 30, depositAmount, false, { from: depositor })
      await loanManager.enableLoanAssetPair(loanAsset.address, collateralAsset.address, { from: owner })
    })

    const loanAmount = toFixedBN(100)
    const collateralAmount = toFixedBN(300)
    let prevLoanAssetBalance, prevCollateralAssetBalance

    it('makes a 7-day loan', async () => {
      const term = 7
      const requestedFreedCollateral = 0
      prevLoanAssetBalance = await loanAsset.balanceOf(loaner)
      prevCollateralAssetBalance = await collateralAsset.balanceOf(loaner)

      await loanManager.loan(
        term, 
        loanAsset.address, 
        collateralAsset.address, 
        loanAmount,
        collateralAmount,
        requestedFreedCollateral,
        { from: loaner }
      )
    })

    it('reduces collateral asset balance from loaner', async () => {
      expect(await collateralAsset.balanceOf(loaner)).to.be.bignumber
        .equal(prevCollateralAssetBalance.sub(collateralAmount))
    })

    it('transfers loan asset balance to loaner', async () => {
      expect(await loanAsset.balanceOf(loaner)).to.be.bignumber
        .equal(prevLoanAssetBalance.add(loanAmount))
    })

    context('after 6 days', () => {
      let repayAmount

      before(async () => {
        await time.increase(time.duration.days(6))
        prevLoanAssetBalance = await loanAsset.balanceOf(loaner)
      })

      it('repays in full', async () => {
        const loanId = 0

        repayAmount = await loanManager.repayLoan.call(
          loanAsset.address, 
          collateralAsset.address, 
          loanId, 
          '-1', 
          { from: loaner }
        )

        await loanManager.repayLoan(
          loanAsset.address, 
          collateralAsset.address, 
          loanId, 
          '-1', 
          { from: loaner }
        )
      })

      it('reduces loan asset balance from loaner', async () => {
        expect(await loanAsset.balanceOf(loaner)).to.be.bignumber
          .equal(prevLoanAssetBalance.sub(repayAmount))
      })
    })
  })
})
