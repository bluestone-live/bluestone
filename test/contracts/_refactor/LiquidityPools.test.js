const LiquidityPools = artifacts.require('_LiquidityPoolsMock');
const { BN } = require('openzeppelin-test-helpers');
const { createERC20Token } = require('../../utils/index');
const { expect } = require('chai');

contract('LiquidityPools', function([owner]) {
  let liquidityPools;

  beforeEach(async () => {
    liquidityPools = await LiquidityPools.new();
  });

  describe('#initPoolGroupIfNeeded', () => {
    let token;

    beforeEach(async () => {
      token = await createERC20Token(owner);
    });

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
    it('succeeds');
  });

  describe('#subtractDepositFromPool', () => {
    it('succeeds');
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
