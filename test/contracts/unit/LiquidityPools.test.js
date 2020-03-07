const LiquidityPools = artifacts.require('LiquidityPoolsMock');
const DateTime = artifacts.require('DateTime');
const { BN, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { createERC20Token, toFixedBN } = require('../../utils/index');
const { expect } = require('chai');

contract('LiquidityPools', function([owner]) {
  let liquidityPools, datetime, token;
  const depositTerm = 30;
  const depositDistributorFeeRatio = toFixedBN(0.02);
  const loanDistributorFeeRatio = toFixedBN(0.01);
  const protocolReserveRatio = toFixedBN(0.07);

  beforeEach(async () => {
    liquidityPools = await LiquidityPools.new();
    datetime = await DateTime.new();
    token = await createERC20Token(owner);
  });

  describe('#setPoolGroupSizeIfNeeded', () => {
    context('when number of pools is valid', () => {
      it('succeed', async () => {
        const poolGroupSize = 30;
        const { logs } = await liquidityPools.setPoolGroupSizeIfNeeded(
          token.address,
          poolGroupSize,
        );
        const numPools = await liquidityPools.getPoolGroupSize(token.address);
        expect(numPools).to.bignumber.equal(new BN(poolGroupSize));
        expectEvent.inLogs(logs, 'SetPoolGroupSizeSucceed');
      });
    });

    context('when number of pools is invalid', () => {
      let prevPoolGroupSize = 30;

      beforeEach(async () => {
        await liquidityPools.setPoolGroupSizeIfNeeded(
          token.address,
          prevPoolGroupSize,
        );
      });

      it('does not update pool group size', async () => {
        const currPoolGroupSize = 20;
        await liquidityPools.setPoolGroupSizeIfNeeded(
          token.address,
          currPoolGroupSize,
        );
        const numPools = await liquidityPools.getPoolGroupSize(token.address);
        expect(numPools).to.bignumber.equal(new BN(prevPoolGroupSize));
      });
    });
  });

  describe('#addDepositToPool', () => {
    const depositAmount = toFixedBN(100);

    beforeEach(async () => {
      await liquidityPools.setPoolGroupSizeIfNeeded(token.address, 365);
    });

    context('when ratios are not set', () => {
      let pool;

      it('succeeds', async () => {
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
        pool = await liquidityPools.getPoolById(token.address, poolId);

        expect(new BN(pool.depositAmount)).to.bignumber.equal(depositAmount);
        expect(new BN(pool.availableAmount)).to.bignumber.equal(depositAmount);
        expect(new BN(pool.loanInterest)).to.bignumber.equal(new BN(0));
      });

      it('updates ratios', async () => {
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

    context('when ratios are set', () => {
      beforeEach(async () => {
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

      it('does not update ratios', async () => {
        await liquidityPools.addDepositToPool(
          token.address,
          depositAmount,
          depositTerm,
          depositAmount.mul(new BN(depositTerm)),
          toFixedBN(0.04),
          toFixedBN(0.02),
          toFixedBN(0.04),
        );

        const firstPoolId = await datetime.toDays();
        const poolId = firstPoolId.add(new BN(depositTerm));
        const pool = await liquidityPools.getPoolById(token.address, poolId);

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
  });

  describe('#subtractDepositFromPool', () => {
    const depositAmount = toFixedBN(100);

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
      const depositDistributorFeeRatioList = Array(6).fill(
        depositDistributorFeeRatio,
      );
      const loanDistributorFeeRatioList = Array(6).fill(
        loanDistributorFeeRatio,
      );
      const protocolReserveRatioList = Array(6).fill(protocolReserveRatio);

      await liquidityPools.populatePoolGroup(
        token.address,
        depositAmountArray,
        availableAmountArray,
        depositDistributorFeeRatioList,
        loanDistributorFeeRatioList,
        protocolReserveRatioList,
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
      const depositDistributorFeeRatioList = Array(6).fill(
        depositDistributorFeeRatio,
      );
      const loanDistributorFeeRatioList = Array(6).fill(
        loanDistributorFeeRatio,
      );
      const protocolReserveRatioList = Array(6).fill(protocolReserveRatio);

      await liquidityPools.populatePoolGroup(
        token.address,
        depositAmountArray,
        availableAmountArray,
        depositDistributorFeeRatioList,
        loanDistributorFeeRatioList,
        protocolReserveRatioList,
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
    let loanId;

    beforeEach(async () => {
      const depositAmountList = [10, 10, 10, 10].map(n => toFixedBN(n));
      const availableAmountList = [10, 10, 10, 10].map(n => toFixedBN(n));
      const depositDistributorFeeRatioList = Array(4).fill(
        depositDistributorFeeRatio,
      );
      const loanDistributorFeeRatioList = Array(4).fill(
        loanDistributorFeeRatio,
      );
      const protocolReserveRatioList = Array(4).fill(protocolReserveRatio);

      await liquidityPools.setPoolGroupSizeIfNeeded(token.address, depositTerm);
      await liquidityPools.populatePoolGroup(
        token.address,
        depositAmountList,
        availableAmountList,
        depositDistributorFeeRatioList,
        loanDistributorFeeRatioList,
        protocolReserveRatioList,
      );
    });

    context('when loan amount is not greater than available amount', () => {
      const loanAmount = toFixedBN(15);
      const loanTerm = 1;
      const loanInterest = toFixedBN(0.5);

      beforeEach(async () => {
        await liquidityPools.createLoanRecord(
          token.address,
          loanAmount,
          loanTerm,
          loanInterest,
        );

        loanId = await liquidityPools.loanIdList(0);
        await liquidityPools.loanFromPools(loanId);
      });

      it('does not borrow from pool[0]', async () => {
        const pool0 = await liquidityPools.getPoolByIndex(token.address, 0);
        expect(new BN(pool0.availableAmount)).to.bignumber.equal(toFixedBN(10));
      });

      it('borrows 10 from pool[1]', async () => {
        const pool1 = await liquidityPools.getPoolByIndex(token.address, 1);
        expect(new BN(pool1.availableAmount)).to.bignumber.equal(new BN(0));
        const pool1LoanAmount = await liquidityPools.getLoanRecordLoanAmountByPool(
          loanId,
          1,
        );
        expect(pool1LoanAmount).to.bignumber.equal(toFixedBN(10));
      });

      it('borrows 5 from pool[2]', async () => {
        const pool2 = await liquidityPools.getPoolByIndex(token.address, 2);
        expect(new BN(pool2.availableAmount)).to.bignumber.equal(toFixedBN(5));
        const pool2LoanAmount = await liquidityPools.getLoanRecordLoanAmountByPool(
          loanId,
          2,
        );
        expect(pool2LoanAmount).to.bignumber.equal(toFixedBN(5));
      });

      it('does not borrow from pool[3]', async () => {
        const pool3 = await liquidityPools.getPoolByIndex(token.address, 3);
        expect(new BN(pool3.availableAmount)).to.bignumber.equal(toFixedBN(10));
      });

      it('updates distributor interest', async () => {
        const loanRecord = await liquidityPools.getLoanRecordById(loanId);

        const distributorInterestFromPool1 = loanInterest
          .mul(toFixedBN(10))
          .div(loanAmount)
          .mul(loanDistributorFeeRatio)
          .div(toFixedBN(1));

        const distributorInterestFromPool2 = loanInterest
          .mul(toFixedBN(5))
          .div(loanAmount)
          .mul(loanDistributorFeeRatio)
          .div(toFixedBN(1));

        const expectedDistributorInterest = distributorInterestFromPool1.add(
          distributorInterestFromPool2,
        );

        expect(new BN(loanRecord.distributorInterest)).to.bignumber.equal(
          expectedDistributorInterest,
        );
      });
    });

    context('when loan amount is greater than available amount', () => {
      it('reverts', async () => {
        const loanAmount = toFixedBN(41);
        const loanTerm = 1;
        const loanInterest = toFixedBN(0.5);

        await liquidityPools.createLoanRecord(
          token.address,
          loanAmount,
          loanTerm,
          loanInterest,
        );

        loanId = await liquidityPools.loanIdList(0);

        await expectRevert(
          liquidityPools.loanFromPools(loanId),
          'LiquidityPools: invalid loan amount',
        );
      });
    });
  });

  describe('#repayLoanToPools', () => {
    let loanId;

    beforeEach(async () => {
      const depositAmountList = [10, 10, 10, 10].map(n => toFixedBN(n));
      const availableAmountList = [10, 10, 10, 10].map(n => toFixedBN(n));
      const depositDistributorFeeRatioList = Array(4).fill(
        depositDistributorFeeRatio,
      );
      const loanDistributorFeeRatioList = Array(4).fill(
        loanDistributorFeeRatio,
      );
      const protocolReserveRatioList = Array(4).fill(protocolReserveRatio);

      await liquidityPools.setPoolGroupSizeIfNeeded(token.address, depositTerm);
      await liquidityPools.populatePoolGroup(
        token.address,
        depositAmountList,
        availableAmountList,
        depositDistributorFeeRatioList,
        loanDistributorFeeRatioList,
        protocolReserveRatioList,
      );
      const loanAmount = toFixedBN(15);
      const loanTerm = 1;
      const loanInterest = toFixedBN(0.5);

      await liquidityPools.createLoanRecord(
        token.address,
        loanAmount,
        loanTerm,
        loanInterest,
      );

      loanId = await liquidityPools.loanIdList(0);
      await liquidityPools.loanFromPools(loanId);
    });

    context('when fully repay', () => {
      beforeEach(async () => {
        const repayAmount = toFixedBN(15);
        await liquidityPools.repayLoanToPools(loanId, repayAmount);
      });

      it('fully repays 10 to pool[1]', async () => {
        const pool1 = await liquidityPools.getPoolByIndex(token.address, 1);
        expect(new BN(pool1.availableAmount)).to.bignumber.equal(toFixedBN(10));
      });

      it('fully repays 5 to pool[2]', async () => {
        const pool2 = await liquidityPools.getPoolByIndex(token.address, 2);
        expect(new BN(pool2.availableAmount)).to.bignumber.equal(toFixedBN(10));
      });
    });

    context('when partial repay', () => {
      beforeEach(async () => {
        const repayAmount = toFixedBN(9);
        await liquidityPools.repayLoanToPools(loanId, repayAmount);
      });

      it('partially repays 6 to pool[1]', async () => {
        const pool1 = await liquidityPools.getPoolByIndex(token.address, 1);
        expect(new BN(pool1.availableAmount)).to.bignumber.equal(toFixedBN(6));
      });

      it('partially repays 3 to pool[2]', async () => {
        const pool2 = await liquidityPools.getPoolByIndex(token.address, 2);
        expect(new BN(pool2.availableAmount)).to.bignumber.equal(toFixedBN(8));
      });
    });
  });

  describe('#getPoolsByToken', () => {
    const depositAmountArray = [0, 1, 2, 3, 4, 5].map(n => toFixedBN(n));
    const availableAmountArray = [0, 1, 1, 1, 1, 1].map(n => toFixedBN(n));
    const depositDistributorFeeRatioList = Array(6).fill(
      depositDistributorFeeRatio,
    );
    const loanDistributorFeeRatioList = Array(6).fill(loanDistributorFeeRatio);
    const protocolReserveRatioList = Array(6).fill(protocolReserveRatio);

    beforeEach(async () => {
      await liquidityPools.setPoolGroupSizeIfNeeded(token.address, depositTerm);

      await liquidityPools.populatePoolGroup(
        token.address,
        depositAmountArray,
        availableAmountArray,
        depositDistributorFeeRatioList,
        loanDistributorFeeRatioList,
        protocolReserveRatioList,
      );
    });

    it('succeeds', async () => {
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
});
