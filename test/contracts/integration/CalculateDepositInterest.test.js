const Configuration = artifacts.require('Configuration')
const PriceOracle = artifacts.require('PriceOracle')
const TokenManager = artifacts.require('TokenManager')
const LiquidityPools = artifacts.require('LiquidityPools')
const Loan = artifacts.require('Loan')
const DateTime = artifacts.require('DateTime')
const DepositManager = artifacts.require('DepositManagerMock')
const LoanManager = artifacts.require('LoanManagerMock')
const { time } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../../utils/index.js')
const { expect } = require('chai')

contract('DepositManager', ([owner, depositor, loaner]) => {
  let depositManager, config, priceOracle, tokenManager, loanManager
  let loanAsset, collateralAsset
  const initialSupply = toFixedBN(3000)
  const depositAmount = toFixedBN(1000)
  const loanInterestRate7 = toFixedBN(5, 8)
  const loanInterestRate30 = toFixedBN(3, 8)

  before(async () => {
    config = await Configuration.deployed()
    priceOracle = await PriceOracle.deployed()
    tokenManager = await TokenManager.deployed()
    liquidityPools = await LiquidityPools.deployed()
    depositManager = await DepositManager.deployed()
    loanManager = await LoanManager.deployed()
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

    await config.setLoanInterestRate(loanAsset.address, 7, loanInterestRate7)
    await config.setLoanInterestRate(loanAsset.address, 30, loanInterestRate30)

    await config.setShareholderAddress(owner);
  });

  describe('calculate deposit interest', () => {
    const loanAmount = toFixedBN(100)
    const collateralAmount = toFixedBN(200)
    let term, loan

    before(async () => {
      term = (await depositManager.getDepositTerms())[0].toNumber()
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
      );

      const loanAddress = await loanManager.loans.call(0);
      loan = await Loan.at(loanAddress);
      const repayAmount = await loan.remainingDebt();

      await loanManager.repayLoan(loanAddress, repayAmount, {
        from: loaner
      });
    });

    context('when deposit is matured', () => {
      before(async () => {
        await config.lockAllUserActions();
        for (let i = 0; i < term; i++) {
          await depositManager.updateDepositMaturity(loanAsset.address, { from: owner })
        }

        await time.increase(time.duration.days(term + 1))
        await config.unlockAllUserActions();
      })

      it("withdraws deposit and interest", async () => {
        const deposit = await depositManager.deposits.call(0);
        const withdrewAmount = await depositManager.withdraw.call(deposit, {
          from: depositor
        });
        const loanInterest = await loan.interest();

        // There are 2 deposits in total
        const totalDeposit = depositAmount.add(depositAmount);
        const profitRatio = toFixedBN(0.15);

        const totalInterest = loanInterest.mul(depositAmount).div(totalDeposit);

        const profitInterest = totalInterest.mul(profitRatio).div(toFixedBN(1));
        const depositInterest = totalInterest.sub(profitInterest);

        // It seems Solidity and bn.js handles rounding decimals differently,
        // so there is a very tiny difference on the result.
        expect(withdrewAmount).to.be.bignumber.closeTo(
          depositAmount.add(depositInterest),
          toFixedBN(0.00001)
        );
      });
    });
  })
})
