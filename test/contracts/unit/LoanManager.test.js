const AccountManager = artifacts.require("AccountManager");
const PriceOracle = artifacts.require("PriceOracle");
const TokenManager = artifacts.require("TokenManager");
const DepositManager = artifacts.require("DepositManagerMock");
const LoanManager = artifacts.require("LoanManagerMock");
const Loan = artifacts.require("Loan");
const { toFixedBN, createERC20Token } = require("../../utils/index.js");
const { expectEvent, expectRevert, constants } = require("openzeppelin-test-helpers");
const { expect } = require("chai");

contract("LoanManager", ([owner, depositor, loaner]) => {
  const initialSupply = toFixedBN(1000);
  const depositAmount = toFixedBN(100);
  const freedCollateralAmount = toFixedBN(1000);
  let accountManager,
    depositManager,
    loanManager,
    loanAsset,
    collateralAsset,
    term;

  before(async () => {
    accountManager = await AccountManager.deployed();
    priceOracle = await PriceOracle.deployed();
    tokenManager = await TokenManager.deployed();
    depositManager = await DepositManager.deployed();
    loanManager = await LoanManager.deployed();
    loanAsset = await createERC20Token(depositor, initialSupply);
    collateralAsset = await createERC20Token(loaner, initialSupply);
    term = (await depositManager.getDepositTerms())[0];

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
    await depositManager.enableDepositAsset(loanAsset.address, { from: owner });
    await depositManager.deposit(loanAsset.address, term, depositAmount, {
      from: depositor
    });
    await loanManager.enableLoanAssetPair(
      loanAsset.address,
      collateralAsset.address,
      { from: owner }
    );

    // add some freed collateral amount
    await accountManager.increaseFreedCollateral(
      collateralAsset.address,
      loaner,
      freedCollateralAmount
    );
  });

  let basicCollateralAmount = toFixedBN(30);

  const createLoan = async (
    loanAmount = toFixedBN(10),
    collateralAmount = basicCollateralAmount,
    useFreedCollateral = false
  ) => {
    await loanManager.loan(
      term,
      loanAsset.address,
      collateralAsset.address,
      loanAmount,
      collateralAmount,
      useFreedCollateral,
      { from: loaner }
    );
  };

  describe("#getLoansByUser", () => {
    before(async () => {
      await createLoan();
      await createLoan();
    });

    it("succeeds", async () => {
      const loanAddresses = await loanManager.getLoansByUser(loaner);
      expect(loanAddresses.length).to.equal(2);
      expect(loanAddresses[0]).to.equal(await loanManager.loans.call(0));
      expect(loanAddresses[1]).to.equal(await loanManager.loans.call(1));
    });
  });

  describe("#addCollateral", () => {
    context("without freed collateral", () => {
      let prevCollateralAssetBalance;
      before(async () => {
        await createLoan();
        prevCollateralAssetBalance = await collateralAsset.balanceOf(loaner);
      });

      it("succeeds and emit a AddCollateralSuccessful event", async () => {
        const loanAddress = await loanManager.loans.call(0);
        const collateralAmount = toFixedBN(10);
        const useFreedCollateral = false;
        const { logs } = await loanManager.addCollateral(
          loanAddress,
          collateralAmount,
          useFreedCollateral,
          { from: loaner }
        );

        expect(await collateralAsset.balanceOf(loaner)).to.be.bignumber.equal(
          prevCollateralAssetBalance.sub(collateralAmount)
        );
        expectEvent.inLogs(logs, "AddCollateralSuccessful", {
          user: loaner,
          amount: collateralAmount
        });
      });
    });

    context("with freed collateral", () => {
      const collateralAmount = toFixedBN(10);
      let prevCollateralAssetBalance, prevFreedCollateralAmount;

      before(async () => {
        prevCollateralAssetBalance = await collateralAsset.balanceOf(loaner);
        prevFreedCollateralAmount = await accountManager.getFreedCollateral(
          collateralAsset.address,
          { from: loaner }
        );
      });

      it("succeeds and emit a AddCollateralSuccessful event", async () => {
        const loanAddress = await loanManager.loans.call(0);
        const useFreedCollateral = true;
        const { logs } = await loanManager.addCollateral(
          loanAddress,
          collateralAmount,
          useFreedCollateral,
          { from: loaner }
        );

        expectEvent.inLogs(logs, "AddCollateralSuccessful", {
          user: loaner,
          amount: collateralAmount
        });
      });

      it("didn't use account balance", async () => {
        expect(await collateralAsset.balanceOf(loaner)).to.be.bignumber.equal(
          prevCollateralAssetBalance
        );
      });

      it("reduce freed collateral amount", async () => {
        const freedCollateralAmount = await accountManager.getFreedCollateral(
          collateralAsset.address,
          { from: loaner }
        );

        expect(freedCollateralAmount).to.bignumber.equal(
          prevFreedCollateralAmount.sub(collateralAmount)
        );
      });
    });

    context("when Loan address is invalid", () => {
      it("reverts", async () => {
        await expectRevert(loanManager.addCollateral(constants.ZERO_ADDRESS, toFixedBN(1), false), "Invalid loan.")
      });
    })
  });

  describe("#repayLoan", () => {
    before(async () => {
      await createLoan();
      await createLoan();
      await createLoan();
    });

    it("repays partially", async () => {
      const loanAddress = await loanManager.loans.call(2);
      const loanInstance = await Loan.at(loanAddress);
      const loanAmount = await loanInstance.loanAmount();
      const wantToPayAmount = loanAmount.sub(toFixedBN(1));
      const { logs } = await loanManager.repayLoan(
        loanAddress,
        wantToPayAmount,
        {
          from: loaner
        }
      );
      const alreadyPaidAmount = await loanInstance.alreadyPaidAmount();
      const isClosed = await loanInstance.isClosed();
      expect(alreadyPaidAmount).to.be.bignumber.equal(wantToPayAmount);
      expect(isClosed).to.be.equal(false);
      expectEvent.inLogs(logs, "RepayLoanSuccessful", {
        user: loaner,
        amount: wantToPayAmount
      });
    });

    it("repays fully", async () => {
      const loanAddress = await loanManager.loans.call(2);
      const loanInstance = await Loan.at(loanAddress);
      const oldRemainingDebt = await loanInstance.remainingDebt();
      const { logs } = await loanManager.repayLoan(
        loanAddress,
        oldRemainingDebt,
        {
          from: loaner
        }
      );
      const remainingDebtAfterRepay = await loanInstance.remainingDebt();
      const isClosed = await loanInstance.isClosed();
      expect(remainingDebtAfterRepay).to.be.bignumber.equal(toFixedBN(0));
      expect(isClosed).to.be.equal(true);
      expectEvent.inLogs(logs, "RepayLoanSuccessful", {
        user: loaner,
        amount: oldRemainingDebt
      });
    });

    context("when Loan address is invalid", () => {
      it("reverts", async () => {
        await expectRevert(loanManager.repayLoan(constants.ZERO_ADDRESS, toFixedBN(1)), "Invalid loan.")
      });
    })
  });

  describe("#liquidateLoan", () => {
    context("when Loan address is invalid", () => {
      it("reverts", async () => {
        await expectRevert(loanManager.liquidateLoan(constants.ZERO_ADDRESS, toFixedBN(1)), "Invalid loan.")
      });
    })
  })

  describe("#addLoanTerm", () => {
    it("succeeds", async () => {
      const term = 60;
      const prevTerms = await loanManager.getLoanTerms();
      await loanManager.addLoanTerm(term);
      const currTerms = await loanManager.getLoanTerms();
      expect(currTerms.length).to.equal(prevTerms.length + 1);
      expect(currTerms.map(term => term.toNumber())).to.contain(term);
    });
  });

  describe("#removeLoanTerm", () => {
    it("succeeds", async () => {
      const term = 60;
      const prevTerms = await loanManager.getLoanTerms();
      await loanManager.removeLoanTerm(term);
      const currTerms = await loanManager.getLoanTerms();
      expect(currTerms.length).to.equal(prevTerms.length - 1);
      expect(currTerms.map(term => term.toNumber())).to.not.contain(term);
    });
  });
});
