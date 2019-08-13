const Configuration = artifacts.require("Configuration");
const PriceOracle = artifacts.require("PriceOracle");
const TokenManager = artifacts.require("TokenManager");
const Loan = artifacts.require("Loan");
const AccountManager = artifacts.require("AccountManager");
const DepositManager = artifacts.require("DepositManagerMock");
const LoanManager = artifacts.require("LoanManagerMock");
const { time } = require("openzeppelin-test-helpers");
const { createERC20Token, toFixedBN } = require("../../utils/index.js");
const { expect } = require("chai");

contract("LoanManager", ([owner, depositor, loaner]) => {
  const initialSupply = toFixedBN(1000);
  let priceOracle,
    tokenManager,
    depositManager,
    loanManager;

  before(async () => {
    config = await Configuration.deployed();
    priceOracle = await PriceOracle.deployed();
    tokenManager = await TokenManager.deployed();
    accountManager = await AccountManager.deployed();
    depositManager = await DepositManager.deployed();
    loanManager = await LoanManager.deployed();
  });

  describe("loan flow positive #1", () => {
    const depositAmount = toFixedBN(100);
    let term, loanAsset, collateralAsset;

    before(async () => {
      term = (await depositManager.getDepositTerms())[0];
      loanAsset = await createERC20Token(depositor, initialSupply);
      collateralAsset = await createERC20Token(loaner, initialSupply);
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

    it("makes a loan", async () => {
      const requestedFreedCollateral = 0;
      prevLoanAssetBalance = await loanAsset.balanceOf(loaner);
      prevCollateralAssetBalance = await collateralAsset.balanceOf(loaner);

      const { logs } = await loanManager.loan(
        term,
        loanAsset.address,
        collateralAsset.address,
        loanAmount,
        collateralAmount,
        requestedFreedCollateral,
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

    context("after 6 days", () => {
      let repayAmount;

      before(async () => {
        await time.increase(time.duration.days(6));
        prevLoanAssetBalance = await loanAsset.balanceOf(loaner);
      });

      it("repays in full", async () => {
        const loanAddress = await loanManager.loans.call(0);
        const loan = await Loan.at(loanAddress);
        repayAmount = await loan.remainingDebt();
        await loanManager.repayLoan(loanAddress, repayAmount, {
          from: loaner
        });
      });

      it("reduces loan asset balance from loaner", async () => {
        expect(await loanAsset.balanceOf(loaner)).to.be.bignumber.equal(
          prevLoanAssetBalance.sub(repayAmount)
        );
      });
    });
  });
});
