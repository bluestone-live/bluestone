const Deposit = artifacts.require("Deposit");
const DateTime = artifacts.require("DateTime");
const { BN, time } = require("openzeppelin-test-helpers");
const { createERC20Token, toFixedBN } = require("../../utils/index.js");
const { expect } = require("chai");

contract("Deposit", ([owner]) => {
  const amount = toFixedBN(100);
  const profitRatio = toFixedBN(0.15);
  const poolId = toFixedBN(0);
  let asset;

  before(async () => {
    asset = await createERC20Token(owner);
  });

  describe("#constructor", async () => {
    const term = new BN(1);
    let deposit, datetime, now, createdAt;

    before(async () => {
      deposit = await Deposit.new(
        asset.address,
        owner,
        term,
        amount,
        profitRatio,
        poolId
      );
      now = await time.latest();
      datetime = await DateTime.new();
    });

    it("updates createdAt", async () => {
      createdAt = await deposit.createdAt();
      expect(createdAt).to.be.bignumber.closeTo(now, new BN(1));
    });

    it("updates maturedAt", async () => {
      const secondsUntilMidnight = await datetime.secondsUntilMidnight(now);
      const dayInSeconds = new BN(86400);
      const maturedAt = createdAt.add(
        secondsUntilMidnight.add(term.mul(dayInSeconds))
      );
      expect(await deposit.maturedAt()).to.be.bignumber.equal(maturedAt);
    });
  });

  describe("#withdrawDepositAndInterest", () => {
    const term = 1;
    let deposit;

    beforeEach(async () => {
      deposit = await Deposit.new(
        asset.address,
        owner,
        term,
        amount,
        profitRatio,
        poolId
      );
    });

    it("succeeds", async () => {
      const currInterestIndex = toFixedBN(0.05);
      const {
        "0": withdrewAmount,
        "1": interestsForShareholders
      } = await deposit.withdrawDepositAndInterest.call(currInterestIndex);

      const expectedTotalInterests = amount
        .mul(currInterestIndex)
        .div(toFixedBN(1));
      const expectedInterestsForShareholder = expectedTotalInterests
        .mul(profitRatio)
        .div(toFixedBN(1));
      const expectedInterestsForDepositor = expectedTotalInterests.sub(
        expectedInterestsForShareholder
      );
      const expectedWithdrewAmount = amount.add(expectedInterestsForDepositor);
      expect(withdrewAmount).to.be.bignumber.equal(expectedWithdrewAmount);
      expect(interestsForShareholders).to.be.bignumber.equal(
        expectedInterestsForShareholder
      );
    });
  });

  describe("#withdrawDeposit", () => {
    const term = 1;
    let deposit;

    beforeEach(async () => {
      deposit = await Deposit.new(
        asset.address,
        owner,
        term,
        amount,
        profitRatio,
        poolId
      );
    });

    it("succeeds", async () => {
      await deposit.withdrawDeposit();
      expect(await deposit.isWithdrawn()).to.be.true;
      expect(await deposit.withdrewAmount()).to.be.bignumber.equal(amount);
    });
  });
});
