const PriceOracle = artifacts.require("PriceOracle");
const TokenManager = artifacts.require("TokenManager");
const Loan = artifacts.require("Loan");
const { toFixedBN, createERC20Token } = require("../../utils/index.js");
const { DepositManagerMock, LoanManagerMock } = require("../../utils/mocks.js");
const { expect } = require("chai");

contract("LoanManager", ([owner, depositor, loaner]) => {
  const initialSupply = toFixedBN(1000);
  const depositAmount = toFixedBN(100);
  let depositManager, loanManager, loanAsset, collateralAsset;

  before(async () => {
    priceOracle = await PriceOracle.deployed();
    tokenManager = await TokenManager.deployed();
    depositManager = await DepositManagerMock();
    loanManager = await LoanManagerMock();
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
    await depositManager.enableDepositAsset(loanAsset.address, { from: owner });
    await depositManager.deposit(loanAsset.address, 1, depositAmount, {
      from: depositor
    });
    await depositManager.deposit(loanAsset.address, 30, depositAmount, {
      from: depositor
    });
    await loanManager.enableLoanAssetPair(
      loanAsset.address,
      collateralAsset.address,
      { from: owner }
    );
  });

  let basicCollateralAmount = toFixedBN(30);

  const createLoan = async (
    term = 1,
    loanAmount = toFixedBN(10),
    collateralAmount = basicCollateralAmount,
    requestedFreedCollateral = 0
  ) => {
    await loanManager.loan(
      term,
      loanAsset.address,
      collateralAsset.address,
      loanAmount,
      collateralAmount,
      requestedFreedCollateral,
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
    let prevCollateralAssetBalance;

    before(async () => {
      await createLoan();
      prevCollateralAssetBalance = await collateralAsset.balanceOf(loaner);
    });

    it("succeeds and emit a AddCollateralSuccessful event", async () => {
      const loanAddress = await loanManager.loans.call(0);
      const collateralAmount = toFixedBN(10);
      const requestedFreedCollateral = 0;
      const { logs } = await loanManager.addCollateral(
        loanAddress,
        collateralAmount,
        requestedFreedCollateral,
        { from: loaner }
      );

      const AddCollateralSuccessfulLogs = logs.filter(
        ({ event }) => event === "AddCollateralSuccessful"
      );

      expect(await collateralAsset.balanceOf(loaner)).to.be.bignumber.equal(
        prevCollateralAssetBalance.sub(collateralAmount)
      );
      expect(AddCollateralSuccessfulLogs.length).to.be.equal(1);
    });
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
      await loanManager.repayLoan(loanAddress, wantToPayAmount, {
        from: loaner
      });
      const alreadyPaidAmount = await loanInstance.alreadyPaidAmount();
      const isClosed = await loanInstance.isClosed();
      expect(alreadyPaidAmount).to.be.bignumber.equal(wantToPayAmount);
      expect(isClosed).to.be.equal(false);
    });
    it("repays fully", async () => {
      const loanAddress = await loanManager.loans.call(2);
      const loanInstance = await Loan.at(loanAddress);
      const oldRemainingDebt = await loanInstance.remainingDebt();
      await loanManager.repayLoan(loanAddress, oldRemainingDebt, {
        from: loaner
      });
      const remainingDebtAfterRepay = await loanInstance.remainingDebt();
      const isClosed = await loanInstance.isClosed();
      expect(remainingDebtAfterRepay).to.be.bignumber.equal(toFixedBN(0));
      expect(isClosed).to.be.equal(true);
    });
  });
});
