const LiquidityPools = artifacts.require('_LiquidityPoolsMock');
const { BN } = require('openzeppelin-test-helpers');
const { createERC20Token, toFixedBN } = require('../../utils/index');
const { expect } = require('chai');

contract('LiquidityPools', function([owner]) {
  let liquidityPools, token;
  const depositTerm = 30;
  const loanTermList = [7, 30];

  beforeEach(async () => {
    liquidityPools = await LiquidityPools.new();
    token = await createERC20Token(owner);
    await liquidityPools.initPoolGroupIfNeeded(token.address, depositTerm);
  });

  describe('#initPoolGroupIfNeeded', () => {
    it('succeed', async () => {
      const depositTerm = 30;
      await liquidityPools.initPoolGroupIfNeeded(token.address, depositTerm);
      const { isInitialized, lastPoolId } = await liquidityPools.getPoolGroup(
        token.address,
        depositTerm,
      );
      expect(isInitialized).to.be.true;
      expect(lastPoolId).to.bignumber.equal(new BN(depositTerm));
    });
  });

  describe('#updateAvailableAmountByTerm', () => {
    it('succeeds');
  });

  describe('#updatePoolGroupDepositMaturity', () => {
    it('succeeds');
  });

  describe('#addDepositToPool', () => {
    it('succeeds', async () => {
      const depositAmount = toFixedBN(100);
      await liquidityPools.addDepositToPool(
        token.address,
        depositAmount,
        depositTerm,
        loanTermList,
      );

      const poolId = depositTerm;
      const pool = await liquidityPools.getPoolById(
        token.address,
        depositTerm,
        poolId,
      );

      expect(pool.depositAmount).to.bignumber.equal(depositAmount);
      expect(pool.borrowedAmount).to.bignumber.equal(new BN(0));
      expect(pool.availableAmount).to.bignumber.equal(depositAmount);
      expect(pool.loanInterest).to.bignumber.equal(new BN(0));

      for (let loanTerm of loanTermList) {
        expect(
          await liquidityPools.getPoolGroupAvailableAmountByTerm(
            token.address,
            depositTerm,
            loanTerm,
          ),
        ).to.bignumber.equal(depositAmount);
      }
    });
  });

  describe('#subtractDepositFromPool', () => {
    const depositAmount = toFixedBN(100);

    beforeEach(async () => {
      await liquidityPools.addDepositToPool(
        token.address,
        depositAmount,
        depositTerm,
        loanTermList,
      );
    });

    it('succeeds', async () => {
      const poolId = depositTerm;

      await liquidityPools.subtractDepositFromPool(
        token.address,
        depositAmount,
        depositTerm,
        poolId,
        loanTermList,
      );

      const pool = await liquidityPools.getPoolById(
        token.address,
        depositTerm,
        poolId,
      );

      expect(pool.depositAmount).to.bignumber.equal(new BN(0));
      expect(pool.borrowedAmount).to.bignumber.equal(new BN(0));
      expect(pool.availableAmount).to.bignumber.equal(new BN(0));
      expect(pool.loanInterest).to.bignumber.equal(new BN(0));

      for (let loanTerm of loanTermList) {
        expect(
          await liquidityPools.getPoolGroupAvailableAmountByTerm(
            token.address,
            depositTerm,
            loanTerm,
          ),
        ).to.bignumber.equal(new BN(0));
      }
    });
  });

  describe('#loanFromPoolGroups', () => {
    it('succeeds');
  });

  describe('#repayLoanToPoolGroup', () => {
    it('succeeds');
  });

  describe('#_loanFromPoolGroup', () => {
    it('succeeds');
  });
});
