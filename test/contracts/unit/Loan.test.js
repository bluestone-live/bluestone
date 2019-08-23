const Loan = artifacts.require("Loan");
const { expectRevert, BN } = require("openzeppelin-test-helpers");
const { toFixedBN, createERC20Token } = require("../../utils/index.js");
const { expect } = require("chai");

contract("Loan", ([owner]) => {
  const term = 30;
  const loanAmount = toFixedBN(100);
  const collateralAmount = toFixedBN(300);
  const interestRate = toFixedBN(0.1);
  const minCollateralRatio = toFixedBN(1.5);
  const liquidationDiscount = toFixedBN(0.05);
  let loanAsset, collateralAsset;

  before(async () => {
    loanAsset = await createERC20Token(owner);
    collateralAsset = await createERC20Token(owner);
  });

  const createLoan = async () => {
    return Loan.new(
      loanAsset.address,
      collateralAsset.address,
      owner,
      term,
      loanAmount,
      collateralAmount,
      interestRate,
      minCollateralRatio,
      liquidationDiscount
    );
  };

  describe("#setRecord", () => {
    let loan;

    before(async () => (loan = await createLoan()));

    it("succeeds", async () => {
      const amount = toFixedBN(70);
      await loan.setRecord(30, 1, amount);
      expect(await loan.getRecord(30, 1)).to.be.bignumber.equal(amount);
    });
  });

  describe("#interest", () => {
    let loan;

    before(async () => (loan = await createLoan()));

    it("generates interest", async () => {
      const interest = loanAmount
        .mul(interestRate)
        .mul(toFixedBN(term))
        .div(toFixedBN(365))
        .div(toFixedBN(1));

      expect(await loan.interest()).to.be.bignumber.equal(interest);
    });
  });

  describe("#repay", () => {
    let loan;

    before(async () => (loan = await createLoan()));

    context("when repay amount is more than remaining debt", () => {
      it("reverts", async () => {
        const amount = await loan.remainingDebt();

        await expectRevert.unspecified(loan.repay(amount.add(toFixedBN(1))));
      });
    });

    context("partial repay", () => {
      let loan;
      const amount = toFixedBN(50);

      before(async () => (loan = await createLoan()));

      it("does not return freed collateral", async () => {
        const res = await loan.repay.call(amount);
        expect(res[1]).to.be.bignumber.equal("0");
      });

      it("repays in partial", async () => {
        await loan.repay(amount);
      });

      it("updates alreadyPaidAmount", async () => {
        expect(await loan.alreadyPaidAmount()).to.be.bignumber.equal(amount);
      });

      it("does not close the loan", async () => {
        expect(await loan.isClosed()).to.be.false;
      });
    });

    context("2. full repay", () => {
      let loan, amount;

      before(async () => (loan = await createLoan()));

      before(async () => {
        amount = await loan.remainingDebt();
      });

      it("returns freed collateral", async () => {
        const res = await loan.repay.call(amount);
        expect(res[1]).to.be.bignumber.equal(collateralAmount);
      });

      it("repays in full", async () => {
        await loan.repay(amount);
      });

      it("closes the loan", async () => {
        expect(await loan.isClosed()).to.be.true;
      });
    });
  });

  describe("#liquidate", () => {
    const assetPrice = toFixedBN(100);
    const collateralPrice = toFixedBN(100);

    context("partial liquidate", () => {
      let loan;

      before(async () => (loan = await createLoan()));

      const amount = toFixedBN(50);

      it("liquidates in partial", async () => {
        await loan.liquidate(amount, assetPrice, collateralPrice);
      });

      it("updates liquidatedAmount", async () => {
        expect(await loan.liquidatedAmount()).to.be.bignumber.equal(amount);
      });

      it("updates soldCollateralAmount", async () => {
        const soldCollateralAmount = toFixedBN(50)
          .mul(new BN(100))
          .div(new BN(95));
        expect(await loan.soldCollateralAmount()).to.be.bignumber.equal(
          soldCollateralAmount
        );
      });

      it("does not close the loan", async () => {
        expect(await loan.isClosed()).to.be.false;
      });
    });

    context("full liquidate", () => {
      let loan, amount;

      before(async () => {
        loan = await createLoan();
        amount = await loan.remainingDebt();
      });

      it("liquidates in full", async () => {
        await loan.liquidate(amount, assetPrice, collateralPrice);
      });

      it("updates liquidatedAmount", async () => {
        expect(await loan.liquidatedAmount()).to.be.bignumber.equal(amount);
      });

      it("has no remaining debt", async () => {
        expect(await loan.remainingDebt()).to.be.bignumber.equal("0");
      });

      it("closes the loan", async () => {
        expect(await loan.isClosed()).to.be.true;
      });
    });

    context("when liquidate amount is more than remaining debt", () => {
      let loan, amount;

      before(async () => {
        loan = await createLoan();
        amount = await loan.remainingDebt();
      });

      it("liquidates in full", async () => {
        await loan.liquidate(
          amount.add(toFixedBN(1)),
          assetPrice,
          collateralPrice
        );
      });

      it("updates liquidatedAmount", async () => {
        expect(await loan.liquidatedAmount()).to.be.bignumber.equal(amount);
      });

      it("has no remaining debt", async () => {
        expect(await loan.remainingDebt()).to.be.bignumber.equal("0");
      });

      it("closes the loan", async () => {
        expect(await loan.isClosed()).to.be.true;
      });
    });

    context("#isLiquidatable", () => {
      const loanPrice = toFixedBN(100);
      const collateralPrice = toFixedBN(30);

      before(async () => {
        loan = await createLoan();
        amount = await loan.remainingDebt();
        await loan.repay(amount);
      });

      it("return false when a loan record closed", async () => {
        expect(await loan.isLiquidatable(loanPrice, collateralPrice)).to.be
          .false;
      });
    });
  });
});
