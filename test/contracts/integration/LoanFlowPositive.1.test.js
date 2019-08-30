const Configuration = artifacts.require("Configuration");
const PriceOracle = artifacts.require("PriceOracle");
const TokenManager = artifacts.require("TokenManager");
const Loan = artifacts.require("Loan");
const AccountManager = artifacts.require("AccountManager");
const DepositManager = artifacts.require("DepositManagerMock");
const LoanManager = artifacts.require("LoanManagerMock");
const LiquidityPools = artifacts.require("LiquidityPools");
const PoolGroup = artifacts.require("PoolGroup");
const { time, BN } = require("openzeppelin-test-helpers");
const { createERC20Token, toFixedBN } = require("../../utils/index.js");
const { expect } = require("chai");

contract("LoanManager", ([owner, depositor, loaner]) => {
  const initialSupply = toFixedBN(1000);
  const interestRate = toFixedBN(0.15);
  const profitRatio = toFixedBN(0.1);
  let priceOracle, tokenManager, depositManager, loanManager, liquidityPools;

  before(async () => {
    config = await Configuration.deployed();
    priceOracle = await PriceOracle.deployed();
    tokenManager = await TokenManager.deployed();
    accountManager = await AccountManager.deployed();
    depositManager = await DepositManager.deployed();
    loanManager = await LoanManager.deployed();
    liquidityPools = await LiquidityPools.deployed();
  });

  describe("loan flow positive #1", () => {
    const depositAmount = toFixedBN(100);
    let term, loanAsset, collateralAsset;

    before(async () => {
      term = (await depositManager.getDepositTerms())[0];
      loanAsset = await createERC20Token(depositor, initialSupply);
      collateralAsset = await createERC20Token(loaner, initialSupply);

      await config.setProfitRatio(profitRatio);

      await config.setLoanInterestRate(loanAsset.address, term, interestRate, {
        from: owner
      });
      await priceOracle.setPrice(loanAsset.address, toFixedBN(10));
      await priceOracle.setPrice(collateralAsset.address, toFixedBN(10));
      await loanAsset.approve(tokenManager.address, initialSupply, {
        from: depositor
      });
      await loanAsset.mint(loaner, initialSupply);
      await loanAsset.approve(tokenManager.address, initialSupply, {
        from: loaner
      });
      await collateralAsset.approve(tokenManager.address, initialSupply, {
        from: loaner
      });
      await depositManager.enableDepositAsset(loanAsset.address, {
        from: owner
      });
      await depositManager.deposit(loanAsset.address, term, depositAmount, {
        from: depositor
      });
      await loanManager.enableLoanAssetPair(
        loanAsset.address,
        collateralAsset.address,
        { from: owner }
      );
    });

    const loanAmount = toFixedBN(100);
    const collateralAmount = toFixedBN(300);
    let prevLoanAssetBalance, prevCollateralAssetBalance;

    let loanSuccessfulLogs;

    let poolGroup;

    before(async () => {
      const poolGroupAddress = await liquidityPools.poolGroups(
        loanAsset.address,
        term
      );
      poolGroup = await PoolGroup.at(poolGroupAddress);
    });

    it("get init amount of the pool", async () => {
      const poolId = await poolGroup.poolIds(term - 1);
      pool = await poolGroup.poolsById(poolId.toString());

      expect(pool.deposit).to.bignumber.equal(depositAmount);
      expect(pool.loanableAmount).to.bignumber.equal(depositAmount);
      expect(pool.loanInterest).to.bignumber.equal(toFixedBN(0));
    });

    it("makes a loan", async () => {
      const useFreedCollateral = false;
      prevLoanAssetBalance = await loanAsset.balanceOf(loaner);
      prevCollateralAssetBalance = await collateralAsset.balanceOf(loaner);

      const { logs } = await loanManager.loan(
        term,
        loanAsset.address,
        collateralAsset.address,
        loanAmount,
        collateralAmount,
        useFreedCollateral,
        { from: loaner }
      );

      loanSuccessfulLogs = logs.filter(
        ({ event }) => event === "LoanSuccessful"
      );
    });

    it("reduces collateral asset balance from loaner", async () => {
      expect(await collateralAsset.balanceOf(loaner)).to.be.bignumber.equal(
        prevCollateralAssetBalance.sub(collateralAmount)
      );
    });

    it("transfers loan asset balance to loaner", async () => {
      expect(await loanAsset.balanceOf(loaner)).to.be.bignumber.equal(
        prevLoanAssetBalance.add(loanAmount)
      );
    });

    it("emit a loan successful event", async () => {
      expect(loanSuccessfulLogs.length).to.be.equal(1);
    });

<<<<<<< HEAD
    let poolGroup;

=======
>>>>>>> [Contract]: get interest index from depositManager
    it("loans from the correct pool", async () => {
      const poolGroupAddress = await liquidityPools.poolGroups(
        loanAsset.address,
        term
      );
      poolGroup = await PoolGroup.at(poolGroupAddress);
      const poolIndex = term.sub(new BN(1));
      const loanableAmount = await poolGroup.getLoanableAmountFromPool(
        poolIndex
      );
      expect(loanableAmount).to.bignumber.equal(depositAmount.sub(loanAmount));
    });

    let loanAddress, loan;

    it("stores loan record", async () => {
      loanAddress = await loanManager.loans.call(0);
      loan = await Loan.at(loanAddress);

      const poolId = term.sub(new BN(1));
      const loanRecordAmount = await loan.getRecord(term, poolId);
      expect(loanRecordAmount).to.bignumber.equal(loanAmount);
    });

    it("reduce loanable amount", async () => {
      const poolId = await poolGroup.poolIds(term - 1);
      pool = await poolGroup.poolsById(poolId.toString());

      expect(pool.deposit).to.bignumber.equal(depositAmount);
      expect(pool.loanableAmount).to.bignumber.equal(
        depositAmount.sub(loanAmount)
      );
    });

    it("increase loan interest", async () => {
      const interest = loanAmount
        .mul(interestRate)
        .mul(toFixedBN(term))
        .div(toFixedBN(365))
        .div(toFixedBN(1));
      const poolId = await poolGroup.poolIds(term - 1);
      pool = await poolGroup.poolsById(poolId.toString());

      expect(pool.loanInterest).to.bignumber.equal(interest);
    });

    it("changes interest index", async () => {
      const poolId = await poolGroup.poolIds(term - 1);
      pool = await poolGroup.poolsById(poolId.toString());

      const deposit = (await depositManager.getDepositsByUser(depositor))[0];
      const interestIndex = await depositManager.getInterestIndex(deposit, {
        from: depositor
      });

      const expectedInterestIndex = pool.loanInterest
        .sub(pool.loanInterest.mul(profitRatio).div(toFixedBN(1)))
        .mul(toFixedBN(1))
        .div(pool.deposit);
      expect(interestIndex).to.bignumber.equal(expectedInterestIndex);
    });

    context("after 6 days", () => {
      const numDays = 6;
      let repayAmount;

      before(async () => {
        await config.lockAllUserActions();

        for (let i = 0; i < numDays; i++) {
          await depositManager.updateDepositMaturity(loanAsset.address);
        }

        await config.unlockAllUserActions();

        await time.increase(time.duration.days(numDays));
        prevLoanAssetBalance = await loanAsset.balanceOf(loaner);
      });

      it("repays in full", async () => {
        repayAmount = await loan.remainingDebt();
        const { logs } = await loanManager.repayLoan(loanAddress, repayAmount, {
          from: loaner
        });
      });

      it("reduces loan asset balance from loaner", async () => {
        expect(await loanAsset.balanceOf(loaner)).to.be.bignumber.equal(
          prevLoanAssetBalance.sub(repayAmount)
        );
      });

      it("repays to the correct pool", async () => {
        const poolIndexAfterSixDays = term.sub(new BN(numDays + 1));
        const loanableAmount = await poolGroup.getLoanableAmountFromPool(
          poolIndexAfterSixDays
        );
        expect(loanableAmount).to.bignumber.equal(repayAmount);
      });

      it("increase freed collateral amount", async () => {
        const freedCollateral = await accountManager.getFreedCollateral(
          collateralAsset.address,
          {
            from: loaner
          }
        );

        expect(freedCollateral).to.bignumber.equal(collateralAmount);
      });
    });
  });
});
