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
  });

  describe('#initPoolGroupIfNeeded', () => {
    it('succeed', async () => {
      const depositTerm = 30;
      await liquidityPools.initPoolGroupIfNeeded(token.address, depositTerm);
      const { isInitialized, lastPoolId } = await liquidityPools.getPoolGroup(
        token.address,
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
    beforeEach(async () => {
      await liquidityPools.initPoolGroupIfNeeded(token.address, depositTerm);
    });

    it('succeeds', async () => {
      const depositAmount = toFixedBN(100);
      await liquidityPools.addDepositToPool(token.address, depositAmount);

      const poolId = depositTerm;
      const pool = await liquidityPools.getPoolById(token.address, poolId);

      expect(pool.depositAmount).to.bignumber.equal(depositAmount);
      expect(pool.borrowedAmount).to.bignumber.equal(new BN(0));
      expect(pool.availableAmount).to.bignumber.equal(depositAmount);
      expect(pool.loanInterest).to.bignumber.equal(new BN(0));

      // TODO(desmond): check availableAmount
    });
  });

  describe('#subtractDepositFromPool', () => {
    const depositAmount = toFixedBN(100);

    beforeEach(async () => {
      await liquidityPools.initPoolGroupIfNeeded(token.address, depositTerm);
      await liquidityPools.addDepositToPool(token.address, depositAmount);
    });

    it('succeeds', async () => {
      const poolId = depositTerm;

      await liquidityPools.subtractDepositFromPool(
        token.address,
        depositAmount,
        poolId,
      );

      const pool = await liquidityPools.getPoolById(token.address, poolId);

      expect(pool.depositAmount).to.bignumber.equal(new BN(0));
      expect(pool.borrowedAmount).to.bignumber.equal(new BN(0));
      expect(pool.availableAmount).to.bignumber.equal(new BN(0));
      expect(pool.loanInterest).to.bignumber.equal(new BN(0));

      // TODO(desmond): check availableAmount
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
