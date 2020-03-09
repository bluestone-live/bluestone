const LiquidityPools = artifacts.require('LiquidityPoolsMock');
const DateTime = artifacts.require('DateTime');
const { BN } = require('openzeppelin-test-helpers');
const { createERC20Token, toFixedBN } = require('../../utils/index');
const { expect } = require('chai');

contract('LiquidityPools', function([owner]) {
  let liquidityPools, datetime, token;
  const depositTerm = 30;

  beforeEach(async () => {
    liquidityPools = await LiquidityPools.new();
    datetime = await DateTime.new();
    token = await createERC20Token(owner);
  });

  describe('#setPoolGroupSizeIfNeeded', () => {
    it('succeed', async () => {
      const depositTerm = 30;
      await liquidityPools.setPoolGroupSizeIfNeeded(token.address, depositTerm);
      const numPools = await liquidityPools.getPoolGroupSize(token.address);
      expect(numPools).to.bignumber.equal(new BN(depositTerm));
    });
  });

  describe('#addDepositToPool', () => {
    beforeEach(async () => {
      await liquidityPools.setPoolGroupSizeIfNeeded(token.address, 365);
    });

    it('succeeds', async () => {
      const depositAmount = toFixedBN(100);
      const depositDistributorFeeRatio = toFixedBN(0.02);
      const loanDistributorFeeRatio = toFixedBN(0.01);
      const protocolReserveRatio = toFixedBN(0.07);

      await liquidityPools.addDepositToPool(
        token.address,
        depositAmount,
        depositTerm,
        depositAmount.mul(new BN(depositTerm)),
        depositDistributorFeeRatio,
        loanDistributorFeeRatio,
        protocolReserveRatio,
      );

      const firstPoolId = await datetime.toDays();
      const poolId = firstPoolId.add(new BN(depositTerm));
      const pool = await liquidityPools.getPoolById(token.address, poolId);

      expect(new BN(pool.depositAmount)).to.bignumber.equal(depositAmount);
      expect(new BN(pool.availableAmount)).to.bignumber.equal(depositAmount);
      expect(new BN(pool.loanInterest)).to.bignumber.equal(new BN(0));
      expect(new BN(pool.depositDistributorFeeRatio)).to.bignumber.equal(
        depositDistributorFeeRatio,
      );
      expect(new BN(pool.loanDistributorFeeRatio)).to.bignumber.equal(
        loanDistributorFeeRatio,
      );
      expect(new BN(pool.protocolReserveRatio)).to.bignumber.equal(
        protocolReserveRatio,
      );
    });
  });

  describe('#subtractDepositFromPool', () => {
    const depositAmount = toFixedBN(100);
    const depositDistributorFeeRatio = toFixedBN(0.02);
    const loanDistributorFeeRatio = toFixedBN(0.01);
    const protocolReserveRatio = toFixedBN(0.07);

    beforeEach(async () => {
      await liquidityPools.setPoolGroupSizeIfNeeded(token.address, 365);
      await liquidityPools.addDepositToPool(
        token.address,
        depositAmount,
        depositTerm,
        depositAmount.mul(new BN(depositTerm)),
        depositDistributorFeeRatio,
        loanDistributorFeeRatio,
        protocolReserveRatio,
      );
    });

    it('succeeds', async () => {
      const firstPoolId = await datetime.toDays();
      const poolId = firstPoolId.add(new BN(depositTerm));

      await liquidityPools.subtractDepositFromPool(
        token.address,
        depositAmount,
        depositAmount.mul(new BN(depositTerm)),
        poolId,
      );

      const pool = await liquidityPools.getPoolById(token.address, poolId);

      expect(new BN(pool.depositAmount)).to.bignumber.equal(new BN(0));
      expect(new BN(pool.availableAmount)).to.bignumber.equal(new BN(0));
      expect(new BN(pool.loanInterest)).to.bignumber.equal(new BN(0));
    });
  });

  describe('#getPoolsByToken', () => {
    beforeEach(async () => {
      await liquidityPools.setPoolGroupSizeIfNeeded(token.address, depositTerm);
    });

    it('succeeds', async () => {
      const depositAmountArray = [0, 1, 2, 3, 4, 5].map(n => toFixedBN(n));
      const availableAmountArray = [0, 1, 1, 1, 1, 1].map(n => toFixedBN(n));

      await liquidityPools.populatePoolGroup(
        token.address,
        depositAmountArray,
        availableAmountArray,
      );

      const poolList = await liquidityPools.getPoolsByToken(token.address);

      for (let i = 0; i < depositAmountArray.length; i++) {
        const { depositAmount, availableAmount } = poolList[i];
        expect(new BN(depositAmount)).to.be.bignumber.equal(
          depositAmountArray[i],
        );
        expect(new BN(availableAmount)).to.be.bignumber.equal(
          availableAmountArray[i],
        );
      }
    });
  });

  describe('#getPoolById', () => {
    let currentPoolId;
    beforeEach(async () => {
      currentPoolId = await datetime.toDays();
      await liquidityPools.setPoolGroupSizeIfNeeded(token.address, depositTerm);
    });

    it('succeeds', async () => {
      const depositAmountArray = [0, 1, 2, 3, 4, 5].map(n => toFixedBN(n));
      const availableAmountArray = [0, 1, 1, 1, 1, 1].map(n => toFixedBN(n));

      await liquidityPools.populatePoolGroup(
        token.address,
        depositAmountArray,
        availableAmountArray,
      );

      for (let i = 0; i < depositAmountArray.length; i++) {
        const {
          depositAmount,
          availableAmount,
        } = await liquidityPools.getPoolById(
          token.address,
          Number.parseInt(currentPoolId, 10) + i,
        );
        expect(new BN(depositAmount)).to.be.bignumber.equal(
          depositAmountArray[i],
        );
        expect(new BN(availableAmount)).to.be.bignumber.equal(
          availableAmountArray[i],
        );
      }
    });
  });

  describe('#loanFromPools', () => {
    beforeEach(async () => {
      const depositAmountList = [10, 10, 10, 10].map(n => toFixedBN(n));
      const availableAmountList = [10, 10, 10, 10].map(n => toFixedBN(n));
      await liquidityPools.setPoolGroupSizeIfNeeded(token.address, depositTerm);
      await liquidityPools.populatePoolGroup(
        token.address,
        depositAmountList,
        availableAmountList,
      );
    });

    it('succeeds', async () => {
      const loanAmount = toFixedBN(15);
      const loanTerm = 1;
      await liquidityPools.createLoanRecord(
        token.address,
        loanAmount,
        loanTerm,
      );
      const loanId = await liquidityPools.loanIdList(0);
      await liquidityPools.loanFromPools(loanId);

      // pool[0] should not get borrowed
      const pool0 = await liquidityPools.getPoolByIndex(token.address, 0);
      expect(new BN(pool0.availableAmount)).to.bignumber.equal(toFixedBN(10));

      // pool[1] should get borrowed 10
      const pool1 = await liquidityPools.getPoolByIndex(token.address, 1);
      expect(new BN(pool1.availableAmount)).to.bignumber.equal(new BN(0));
      const pool1LoanAmount = await liquidityPools.getLoanRecordLoanAmountByPool(
        loanId,
        1,
      );
      expect(pool1LoanAmount).to.bignumber.equal(toFixedBN(10));

      // pool[2] should get borrowed 5
      const pool2 = await liquidityPools.getPoolByIndex(token.address, 2);
      expect(new BN(pool2.availableAmount)).to.bignumber.equal(toFixedBN(5));
      const pool2LoanAmount = await liquidityPools.getLoanRecordLoanAmountByPool(
        loanId,
        2,
      );
      expect(pool2LoanAmount).to.bignumber.equal(toFixedBN(5));

      // pool[3] should not get borrowed
      const pool3 = await liquidityPools.getPoolByIndex(token.address, 3);
      expect(new BN(pool3.availableAmount)).to.bignumber.equal(toFixedBN(10));
    });
  });

  describe('#repayLoanToPools', () => {
    let loanId;

    beforeEach(async () => {
      const depositAmountList = [10, 10, 10, 10].map(n => toFixedBN(n));
      const availableAmountList = [10, 10, 10, 10].map(n => toFixedBN(n));
      await liquidityPools.setPoolGroupSizeIfNeeded(token.address, depositTerm);
      await liquidityPools.populatePoolGroup(
        token.address,
        depositAmountList,
        availableAmountList,
      );
      const loanAmount = toFixedBN(15);
      const loanTerm = 1;
      await liquidityPools.createLoanRecord(
        token.address,
        loanAmount,
        loanTerm,
      );
      loanId = await liquidityPools.loanIdList(0);
      await liquidityPools.loanFromPools(loanId);
    });

    it('succeeds', async () => {
      const repayAmount = toFixedBN(15);
      await liquidityPools.repayLoanToPools(loanId, repayAmount);

      // pool[1] should get fully repaid
      const pool1 = await liquidityPools.getPoolByIndex(token.address, 1);
      expect(new BN(pool1.availableAmount)).to.bignumber.equal(toFixedBN(10));

      // pool[2] should get fully repaid
      const pool2 = await liquidityPools.getPoolByIndex(token.address, 2);
      expect(new BN(pool2.availableAmount)).to.bignumber.equal(toFixedBN(10));
    });
  });
});
