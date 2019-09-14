const PoolGroup = artifacts.require("PoolGroup");
const { expectRevert, BN } = require("openzeppelin-test-helpers");
const { toFixedBN } = require("../../utils/index.js");
const { expect } = require("chai");

contract("PoolGroup", () => {
  const term = 30;
  const poolIndex = 0;
  const amount = toFixedBN(100);
  const loanInterest = toFixedBN(10);
  let poolGroup, pool;

  describe("#addDepositToPool", () => {
    before(async () => {
      poolGroup = await PoolGroup.new(term);
    });

    it("succeeds", async () => {
      await poolGroup.addDepositToPool(poolIndex, amount);
      const poolId = await poolGroup.poolIds(poolIndex);
      pool = await poolGroup.poolsById(poolId);
    });

    it("updates deposit", async () => {
      expect(pool.deposit).to.be.bignumber.equal(amount);
    });

    it("updates totalDeposit", async () => {
      expect(await poolGroup.totalDeposit()).to.be.bignumber.equal(amount);
    });
  });

  describe("#subDepositFromPool", () => {
    const halfAmount = toFixedBN(50);
    const doubleAmount = toFixedBN(200);
    before(async () => {
      poolGroup = await PoolGroup.new(term);
      await poolGroup.addDepositToPool(poolIndex, amount);
    });

    it("updates deposit", async () => {
      await poolGroup.subDepositFromPool(poolIndex, halfAmount);
      const poolId = await poolGroup.poolIds(poolIndex);
      pool = await poolGroup.poolsById(poolId);
      expect(pool.deposit).to.be.bignumber.equal(amount.sub(halfAmount));
    });

    it("updates totalDeposit", async () => {
      expect(await poolGroup.totalDeposit()).to.be.bignumber.equal(amount.sub(halfAmount));
    });

    it("updates revert", async () => {
        await expectRevert.unspecified(poolGroup.subDepositFromPool(poolIndex, doubleAmount));
    });
  });

  describe("#loanFromPool", () => {
    const loanTerm = 1;

    before(async () => {
      poolGroup = await PoolGroup.new(term);
      await poolGroup.addDepositToPool(poolIndex, amount);
    });

    context("when loanable amount is not enough", () => {
      it("reverts", async () => {
        await expectRevert.unspecified(
          poolGroup.loanFromPool(
            poolIndex,
            toFixedBN(101),
            loanInterest,
            loanTerm
          )
        );
      });
    });

    it("succeeds", async () => {
      const poolId = await poolGroup.poolIds(poolIndex);
      await poolGroup.loanFromPool(poolIndex, amount, loanInterest, loanTerm);
      pool = await poolGroup.poolsById(poolId);
    });

    it("updates loanableAmount", async () => {
      expect(pool.loanableAmount).to.be.bignumber.equal("0");
    });

    it("updates totalLoan", async () => {
      expect(await poolGroup.totalLoan()).to.be.bignumber.equal(amount);
    });

    it("updates totalLoanPerTerm", async () => {
      expect(await poolGroup.totalLoanPerTerm(loanTerm)).to.be.bignumber.equal(
        amount
      );
    });

    it("updates pool's loanInterest", () => {
      expect(pool.loanInterest).to.be.bignumber.equal(loanInterest);
    });
  });

  describe("#repayLoanToPool", () => {
    const loanTerm = 1;

    before(async () => {
      poolGroup = await PoolGroup.new(term);
      await poolGroup.addDepositToPool(poolIndex, amount);
      await poolGroup.loanFromPool(poolIndex, amount, loanInterest, loanTerm);
    });

    it("succeeds", async () => {
      const poolId = await poolGroup.poolIds(poolIndex);
      await poolGroup.repayLoanToPool(poolIndex, amount, loanTerm);
      pool = await poolGroup.poolsById(poolId);
    });

    it("updates loanableAmount", async () => {
      expect(pool.loanableAmount).to.be.bignumber.equal(amount);
    });

    it("updates totalRepaid", async () => {
      expect(await poolGroup.totalRepaid()).to.be.bignumber.equal(amount);
    });

    it("updates totalRepaidPerTerm", async () => {
      expect(
        await poolGroup.totalRepaidPerTerm(loanTerm)
      ).to.be.bignumber.equal(amount);
    });
  });

  describe("#clearDepositFromPool", () => {
    const loanTerm = 1;

    before(async () => {
      poolGroup = await PoolGroup.new(term);
      await poolGroup.addDepositToPool(poolIndex, amount);
      await poolGroup.loanFromPool(poolIndex, amount, loanInterest, loanTerm);
    });

    it("succeeds", async () => {
      await poolGroup.clearDepositFromPool(poolIndex);
    });

    it("clears deposit", async () => {
      const poolId = await poolGroup.poolIds(poolIndex);
      pool = await poolGroup.poolsById(poolId);
      expect(pool.deposit).to.be.bignumber.equal("0");
    });
  });

  describe("#clearLoanInterestFromPool", () => {
    const loanTerm = 1;

    before(async () => {
      poolGroup = await PoolGroup.new(term);
      await poolGroup.addDepositToPool(poolIndex, amount);
      await poolGroup.loanFromPool(poolIndex, amount, loanInterest, loanTerm);
    });

    it("succeeds", async () => {
      await poolGroup.clearLoanInterestFromPool(poolIndex);
    });

    it("clears loanInterest", async () => {
      const poolId = await poolGroup.poolIds(poolIndex);
      pool = await poolGroup.poolsById(poolId);
      expect(pool.loanInterest).to.be.bignumber.equal("0");
    });
  });

  describe("#updatePoolIds", () => {
    const initialPoolIndexes = [...Array(term).keys()];

    before(async () => {
      poolGroup = await PoolGroup.new(term);
    });

    it("updates pool ids correctly after one time", async () => {
      await poolGroup.updatePoolIds();

      const updatedPoolIndexes = initialPoolIndexes
        .map(n => (n + 1 < term ? n + 1 : 0))
        .map(n => new BN(n));

      for (let i = 0; i < term; i++) {
        expect(await poolGroup.poolIds(i)).to.be.bignumber.equal(
          updatedPoolIndexes[i]
        );
      }
    });

    it("updates pool ids correctly after 30 times", async () => {
      for (let i = 0; i < term - 1; i++) {
        await poolGroup.updatePoolIds();
      }

      const updatedPoolIndexes = initialPoolIndexes.map(n => new BN(n));

      for (let i = 0; i < term; i++) {
        expect(await poolGroup.poolIds(i)).to.be.bignumber.equal(
          updatedPoolIndexes[i]
        );
      }
    });
  });

  describe("#getDaysAfterDepositCreation", () => {
    const afterZeroDay = 0;
    const afterTwoDays = 2;
    const afterTermDays = 0;
    const poolId = term - 1;

    before(async () => {
      poolGroup = await PoolGroup.new(term);
    });

    it("updates pool ids after zero time", async () => {
      expect(await poolGroup.getDaysAfterDepositCreation(poolId)).to.be.bignumber.equal(new BN(afterZeroDay));
    });

    it("updates pool ids after two times", async () => {
      for (let i = 0; i < afterTwoDays; i++) {
        await poolGroup.updatePoolIds();
      }
      expect(await poolGroup.getDaysAfterDepositCreation(poolId)).to.be.bignumber.equal(new BN(afterTwoDays));
    });

    it("updates pool ids after term(30) times", async () => {
      for (let i = 0; i < term - afterTwoDays; i++) {
        await poolGroup.updatePoolIds();
      }
      expect(await poolGroup.getDaysAfterDepositCreation(poolId)).to.be.bignumber.equal(new BN(afterTermDays));
    });

    it("lookup a invalid id", async () => {
      expect(await poolGroup.getDaysAfterDepositCreation(term)).to.be.bignumber.equal(new BN(term));
    })
  });
});
