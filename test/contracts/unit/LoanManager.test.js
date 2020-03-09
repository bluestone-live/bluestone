const LoanManager = artifacts.require('LoanManagerMock');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const InterestModel = artifacts.require('InterestModel');
const DateTime = artifacts.require('DateTime');
const WETH9 = artifacts.require('WETH9');
const {
  toFixedBN,
  createERC20Token,
  ETHIdentificationAddress,
} = require('../../utils/index.js');
const PayableProxy = artifacts.require('PayableProxy');
const {
  BN,
  expectRevert,
  expectEvent,
  time,
} = require('openzeppelin-test-helpers');
const { expect } = require('chai');

contract('LoanManager', function([
  owner,
  depositor,
  loaner,
  liquidator,
  distributorAddress,
]) {
  let loanManager,
    priceOracle,
    collateralPriceOracle,
    interestModel,
    payableProxy,
    datetime;
  const depositDistributorFeeRatio = toFixedBN(0.01);
  const loanDistributorFeeRatio = toFixedBN(0.02);
  const minCollateralCoverageRatio = toFixedBN(1.5);
  const liquidationDiscount = toFixedBN(0.05);
  const initialSupply = toFixedBN(1000);

  let weth, loanToken, collateralToken;

  const setLoanAndCollateralTokenPair = async () => {
    await loanManager.setLoanAndCollateralTokenPair(
      loanToken.address,
      collateralToken.address,
      minCollateralCoverageRatio,
      liquidationDiscount,
    );
  };

  beforeEach(async () => {
    loanManager = await LoanManager.new();
    priceOracle = await SingleFeedPriceOracle.new();
    collateralPriceOracle = await SingleFeedPriceOracle.new();
    interestModel = await InterestModel.new();
    datetime = await DateTime.new();

    weth = await WETH9.new();
    await loanManager.setInterestModel(interestModel.address);
    await loanManager.setMaxDistributorFeeRatios(
      depositDistributorFeeRatio,
      loanDistributorFeeRatio,
    );
    payableProxy = await PayableProxy.new(loanManager.address, weth.address);

    await loanManager.setPayableProxy(payableProxy.address);

    loanToken = await createERC20Token(depositor, initialSupply);
    collateralToken = await createERC20Token(loaner, initialSupply);
  });

  describe('#getLoanRecordById', () => {
    context('when loan id is valid', () => {
      const depositAmount = toFixedBN(10);
      const depositTerm = 30;
      const loanAmount = toFixedBN(10);
      const collateralAmount = toFixedBN(30);
      const loanTerm = 30;

      let recordId;

      beforeEach(async () => {
        await priceOracle.setPrice(toFixedBN(10));
        await loanManager.setPriceOracle(
          loanToken.address,
          priceOracle.address,
        );
        await loanManager.setPriceOracle(
          collateralToken.address,
          priceOracle.address,
        );
        await loanManager.enableDepositToken(loanToken.address);
        await loanManager.enableDepositTerm(depositTerm);
        await loanToken.approve(loanManager.address, initialSupply, {
          from: depositor,
        });

        await collateralToken.approve(loanManager.address, initialSupply, {
          from: loaner,
        });

        await loanManager.deposit(
          loanToken.address,
          depositAmount,
          depositTerm,
          distributorAddress,
          {
            from: depositor,
          },
        );

        await loanManager.setLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          minCollateralCoverageRatio,
          liquidationDiscount,
        );

        const { logs } = await loanManager.loan(
          loanToken.address,
          collateralToken.address,
          loanAmount,
          collateralAmount,
          loanTerm,
          distributorAddress,
          {
            from: loaner,
          },
        );

        recordId = logs.filter(log => log.event === 'LoanSucceed')[0].args
          .recordId;
      });

      it('succeed', async () => {
        const record = await loanManager.getLoanRecordById(recordId);

        expect(record.loanTokenAddress).to.equal(loanToken.address);
        expect(record.collateralTokenAddress).to.equal(collateralToken.address);
        expect(new BN(record.loanTerm)).to.bignumber.equal(new BN(loanTerm));
        expect(new BN(record.loanAmount)).to.bignumber.equal(loanAmount);
        expect(new BN(record.collateralAmount)).to.bignumber.equal(
          collateralAmount,
        );
        expect(record.dueAt).to.equal(
          (
            Number.parseInt(record.createdAt, 10) +
            86400 * record.loanTerm
          ).toString(),
        );
      });
    });

    context('when loan id is invalid', () => {
      it('revert', async () => {
        await expectRevert(
          loanManager.getLoanRecordById(web3.utils.hexToBytes('0x00000000')),
          'LoanManager: invalid loan ID',
        );
      });
    });
  });

  describe('#getLoanRecordsByAccount', () => {
    context("when user didn't have any loan records", () => {
      it('should return empty resultSet', async () => {
        const loanRecordList = await loanManager.getLoanRecordsByAccount(owner);
        expect(loanRecordList.length).to.equal(0);
      });
    });

    context('when user have loan records', () => {
      const depositAmount = toFixedBN(10);
      const depositTerm = 30;
      const loanAmount = toFixedBN(10);
      const collateralAmount = toFixedBN(30);
      const loanTerm = 30;

      beforeEach(async () => {
        await priceOracle.setPrice(toFixedBN(10));
        await loanManager.setPriceOracle(
          loanToken.address,
          priceOracle.address,
        );
        await loanManager.setPriceOracle(
          collateralToken.address,
          priceOracle.address,
        );
        await loanManager.enableDepositToken(loanToken.address);
        await loanManager.enableDepositTerm(depositTerm);
        await loanToken.approve(loanManager.address, initialSupply, {
          from: depositor,
        });

        await collateralToken.approve(loanManager.address, initialSupply, {
          from: loaner,
        });

        await loanManager.deposit(
          loanToken.address,
          depositAmount,
          depositTerm,
          distributorAddress,
          {
            from: depositor,
          },
        );

        await loanManager.setLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          minCollateralCoverageRatio,
          liquidationDiscount,
        );

        const { logs } = await loanManager.loan(
          loanToken.address,
          collateralToken.address,
          loanAmount,
          collateralAmount,
          loanTerm,
          distributorAddress,
          {
            from: loaner,
          },
        );

        recordId = logs.filter(log => log.event === 'LoanSucceed')[0].args
          .recordId;
      });

      it('succeeds', async () => {
        const loanRecordList = await loanManager.getLoanRecordsByAccount(
          loaner,
        );
        expect(loanRecordList.length).to.equal(1);
      });
    });
  });

  describe('#addCollateral', () => {
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;
    const loanAmount = toFixedBN(10);
    const collateralAmount = toFixedBN(30);
    const loanTerm = 30;

    let recordId, prevLoanerCollateralBalance, prevProtocolCollateralBalance;

    beforeEach(async () => {
      await priceOracle.setPrice(toFixedBN(10));
      await loanManager.setPriceOracle(loanToken.address, priceOracle.address);
      await loanManager.setPriceOracle(
        collateralToken.address,
        priceOracle.address,
      );
      await loanManager.enableDepositToken(loanToken.address);
      await loanManager.enableDepositTerm(depositTerm);
      await loanToken.approve(loanManager.address, initialSupply, {
        from: depositor,
      });

      await collateralToken.approve(loanManager.address, initialSupply, {
        from: loaner,
      });

      await loanManager.deposit(
        loanToken.address,
        depositAmount,
        depositTerm,
        distributorAddress,
        {
          from: depositor,
        },
      );

      await setLoanAndCollateralTokenPair();

      const { logs } = await loanManager.loan(
        loanToken.address,
        collateralToken.address,
        loanAmount,
        collateralAmount,
        loanTerm,
        distributorAddress,
        {
          from: loaner,
        },
      );

      recordId = logs.filter(log => log.event === 'LoanSucceed')[0].args
        .recordId;

      prevLoanerCollateralBalance = await collateralToken.balanceOf(loaner);
      prevProtocolCollateralBalance = await collateralToken.balanceOf(
        loanManager.address,
      );
    });

    context('when collateral amount is invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          loanManager.addCollateral(recordId, new BN(0), {
            from: loaner,
          }),
          'LoanManager: invalid collateralAmount',
        );
      });
    });

    context('when collateral amount is valid', () => {
      const collateralAmount = toFixedBN(10);
      let tx;

      beforeEach(async () => {
        tx = await loanManager.addCollateral(recordId, collateralAmount, {
          from: loaner,
        });
      });

      it('emits event', async () => {
        expectEvent.inLogs(tx.logs, 'AddCollateralSucceed', {
          accountAddress: loaner,
          recordId,
          collateralAmount,
        });
      });

      it('reduces collateral tokens from loaner', async () => {
        const currLoanerCollateralBalance = await collateralToken.balanceOf(
          loaner,
        );

        expect(currLoanerCollateralBalance).to.bignumber.equal(
          prevLoanerCollateralBalance.sub(collateralAmount),
        );
      });

      it('adds collateral tokens to protocol', async () => {
        const currProtocolCollateralBalance = await collateralToken.balanceOf(
          loanManager.address,
        );

        expect(currProtocolCollateralBalance).to.bignumber.equal(
          prevProtocolCollateralBalance.add(collateralAmount),
        );
      });
    });
  });

  describe('#setLoanAndCollateralTokenPair', () => {
    context('when loan and collateral token are the same', () => {
      it('reverts', async () => {
        await expectRevert(
          loanManager.setLoanAndCollateralTokenPair(
            loanToken.address,
            loanToken.address,
            minCollateralCoverageRatio,
            liquidationDiscount,
            { from: owner },
          ),
          'LoanManager: invalid token pair',
        );
      });
    });

    context('when loan and collateral token are different', () => {
      it('success', async () => {
        // TODO(lambda): test it after finish getLoanAndCollateralTokenPairs method.
        await loanManager.setLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          minCollateralCoverageRatio,
          liquidationDiscount,
          { from: owner },
        );
      });
    });
  });

  describe('#removeLoanAndCollateralTokenPair', () => {
    context('when the pair does not exist', () => {
      it('reverts', async () => {
        await expectRevert(
          loanManager.removeLoanAndCollateralTokenPair(
            loanToken.address,
            collateralToken.address,
            { from: owner },
          ),
          'LoanManager: invalid token pair',
        );
      });
    });

    context('when the pair gets removed after being added', () => {
      it('success', async () => {
        // TODO(lambda): test it after finish getLoanAndCollateralTokenPairs method.
        await loanManager.setLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          minCollateralCoverageRatio,
          liquidationDiscount,
          { from: owner },
        );
        await loanManager.removeLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
      });
    });
  });

  describe('#loan', () => {
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;

    beforeEach(async () => {
      await priceOracle.setPrice(toFixedBN(10));
      await loanManager.setPriceOracle(loanToken.address, priceOracle.address);
      await loanManager.setPriceOracle(
        collateralToken.address,
        priceOracle.address,
      );
      await loanManager.setPriceOracle(
        ETHIdentificationAddress,
        priceOracle.address,
      );
      await loanManager.enableDepositToken(loanToken.address);
      await loanManager.enableDepositTerm(depositTerm);
      await loanToken.approve(loanManager.address, initialSupply, {
        from: depositor,
      });

      await collateralToken.approve(loanManager.address, initialSupply, {
        from: loaner,
      });

      await loanManager.deposit(
        loanToken.address,
        depositAmount.mul(new BN(2)),
        depositTerm,
        distributorAddress,
        {
          from: depositor,
        },
      );
    });

    context('when loan and collateral token pair is not enabled', () => {
      it('reverts', async () => {
        const loanAmount = toFixedBN(10);
        const collateralAmount = toFixedBN(30);
        const loanTerm = 30;

        await expectRevert(
          loanManager.loan(
            loanToken.address,
            collateralToken.address,
            loanAmount,
            collateralAmount,
            loanTerm,
            distributorAddress,
            {
              from: loaner,
            },
          ),
          'LoanManager: invalid token pair',
        );
      });
    });

    context('when loan amount is invalid', () => {
      beforeEach(async () => {
        await setLoanAndCollateralTokenPair();
      });

      it('reverts', async () => {
        const loanAmount = new BN(0);
        const collateralAmount = toFixedBN(30);
        const loanTerm = 30;

        await expectRevert(
          loanManager.loan(
            loanToken.address,
            collateralToken.address,
            loanAmount,
            collateralAmount,
            loanTerm,
            distributorAddress,
            {
              from: loaner,
            },
          ),
          'LoanManager: invalid loan amount',
        );
      });
    });

    context('when collateral amount is invalid', () => {
      beforeEach(async () => {
        await setLoanAndCollateralTokenPair();
      });

      it('reverts', async () => {
        const loanAmount = toFixedBN(10);
        const collateralAmount = new BN(0);
        const loanTerm = 30;

        await expectRevert(
          loanManager.loan(
            loanToken.address,
            collateralToken.address,
            loanAmount,
            collateralAmount,
            loanTerm,
            distributorAddress,
            {
              from: loaner,
            },
          ),
          'LoanManager: invalid collateral amount',
        );
      });
    });

    context('when loan term is invalid', () => {
      beforeEach(async () => {
        await setLoanAndCollateralTokenPair();
      });

      it('reverts', async () => {
        const loanAmount = toFixedBN(10);
        const collateralAmount = toFixedBN(30);
        const loanTerm = 31;

        await expectRevert(
          loanManager.loan(
            loanToken.address,
            collateralToken.address,
            loanAmount,
            collateralAmount,
            loanTerm,
            distributorAddress,
            {
              from: loaner,
            },
          ),
          'LoanManager: invalid loan term',
        );
      });
    });

    context('when collateral coverage ratio is invalid', () => {
      beforeEach(async () => {
        await setLoanAndCollateralTokenPair();
      });

      it('reverts', async () => {
        const loanAmount = toFixedBN(10);
        const collateralAmount = toFixedBN(10);
        const loanTerm = 30;

        await expectRevert(
          loanManager.loan(
            loanToken.address,
            collateralToken.address,
            loanAmount,
            collateralAmount,
            loanTerm,
            distributorAddress,
            {
              from: loaner,
            },
          ),
          'LoanManager: invalid collateral coverage ratio',
        );
      });
    });

    context('when all input is valid', () => {
      beforeEach(async () => {
        await setLoanAndCollateralTokenPair();
      });

      it('succeeds', async () => {
        const loanAmount = toFixedBN(10);
        const collateralAmount = toFixedBN(30);
        const loanTerm = 30;

        const { logs } = await loanManager.loan(
          loanToken.address,
          collateralToken.address,
          loanAmount,
          collateralAmount,
          loanTerm,
          distributorAddress,
          {
            from: loaner,
          },
        );

        expectEvent.inLogs(logs, 'LoanSucceed', {
          accountAddress: loaner,
        });
      });
    });

    context('when loan token by collateral ETH', () => {
      beforeEach(async () => {
        await loanManager.setLoanAndCollateralTokenPair(
          loanToken.address,
          ETHIdentificationAddress,
          minCollateralCoverageRatio,
          liquidationDiscount,
        );
      });

      it('succeeds', async () => {
        const loanAmount = toFixedBN(10);
        const collateralAmount = toFixedBN(30);
        const loanTerm = 30;

        const { logs } = await loanManager.loan(
          loanToken.address,
          ETHIdentificationAddress,
          loanAmount,
          toFixedBN(0),
          loanTerm,
          distributorAddress,
          {
            from: loaner,
            value: collateralAmount,
          },
        );

        expectEvent.inLogs(logs, 'LoanSucceed', {
          accountAddress: loaner,
        });
      });
    });
  });

  describe('#repayLoan', () => {
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;
    const loanAmount = toFixedBN(10);
    const collateralAmount = toFixedBN(30);
    const loanTerm = 30;
    let recordId;

    beforeEach(async () => {
      await loanToken.mint(loaner, initialSupply);
      await priceOracle.setPrice(toFixedBN(10));
      await loanManager.setPriceOracle(loanToken.address, priceOracle.address);
      await loanManager.setPriceOracle(
        collateralToken.address,
        priceOracle.address,
      );
      await loanManager.enableDepositToken(loanToken.address);
      await setLoanAndCollateralTokenPair();
      await interestModel.setLoanParameters(
        loanToken.address,
        toFixedBN(0.1),
        toFixedBN(0.15),
      );
      await loanManager.enableDepositTerm(depositTerm);

      await loanToken.approve(loanManager.address, initialSupply, {
        from: depositor,
      });
      await collateralToken.approve(loanManager.address, initialSupply, {
        from: loaner,
      });

      await loanManager.deposit(
        loanToken.address,
        depositAmount,
        depositTerm,
        distributorAddress,
        {
          from: depositor,
        },
      );

      const { logs } = await loanManager.loan(
        loanToken.address,
        collateralToken.address,
        loanAmount,
        collateralAmount,
        loanTerm,
        distributorAddress,
        {
          from: loaner,
        },
      );

      recordId = logs.filter(log => log.event === 'LoanSucceed')[0].args
        .recordId;

      await loanToken.approve(loanManager.address, initialSupply, {
        from: loaner,
      });
    });

    context('when owner is invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          loanManager.repayLoan(recordId, loanAmount, { from: depositor }),
          'LoanManager: invalid owner',
        );
      });
    });

    context('when loan record is closed', () => {
      beforeEach(async () => {
        const loanRecord = await loanManager.getLoanRecordById(recordId);
        await loanManager.repayLoan(recordId, loanRecord.remainingDebt, {
          from: loaner,
        });
      });

      it('reverts', async () => {
        await expectRevert(
          loanManager.repayLoan(recordId, loanAmount, { from: loaner }),
          'LoanManager: loan already closed',
        );
      });
    });

    context('when repay amount is greater than remaining debt', () => {
      it('reverts', async () => {
        const loanRecord = await loanManager.getLoanRecordById(recordId);

        await expectRevert(
          loanManager.repayLoan(
            recordId,
            new BN(loanRecord.remainingDebt).add(new BN(1)),
            {
              from: loaner,
            },
          ),
          'LoanManager: invalid repay amount',
        );
      });
    });

    context('when repays full pricipal', () => {
      let tx;

      beforeEach(async () => {
        tx = await loanManager.repayLoan(recordId, loanAmount, {
          from: loaner,
        });
      });

      it('emits event', async () => {
        expectEvent.inLogs(tx.logs, 'RepayLoanSucceed', {
          accountAddress: loaner,
          recordId: recordId,
          amount: loanAmount,
        });
      });

      it('updates loan record', async () => {
        const loanRecord = await loanManager.getLoanRecordById(recordId);

        expect(new BN(loanRecord.remainingDebt)).to.bignumber.equal(
          new BN(loanRecord.interest),
        );

        expect(loanRecord.isClosed).to.be.false;
      });

      it('repays principal back to pool', async () => {
        const poolId = (await datetime.toDays()).add(new BN(depositTerm));
        const pool = await loanManager.getPoolById(loanToken.address, poolId);

        expect(new BN(pool.availableAmount)).to.bignumber.equal(
          new BN(pool.depositAmount),
        );
      });

      it('sends no token to distributor', async () => {
        const distributorBalance = await loanToken.balanceOf(
          distributorAddress,
        );

        expect(distributorBalance).to.bignumber.equal(toFixedBN(0));
      });
    });

    context('when repays full principal and partial interest', () => {
      let tx, repayAmount;
      const targetRemainingDebt = new BN(1000);

      beforeEach(async () => {
        const loanRecord = await loanManager.getLoanRecordById(recordId);
        repayAmount = new BN(loanRecord.remainingDebt).sub(targetRemainingDebt);

        tx = await loanManager.repayLoan(recordId, repayAmount, {
          from: loaner,
        });
      });

      it('emits event', async () => {
        expectEvent.inLogs(tx.logs, 'RepayLoanSucceed', {
          accountAddress: loaner,
          recordId: recordId,
          amount: repayAmount,
        });
      });

      it('updates loan record', async () => {
        const loanRecord = await loanManager.getLoanRecordById(recordId);

        expect(new BN(loanRecord.remainingDebt)).to.bignumber.equal(
          targetRemainingDebt,
        );

        expect(loanRecord.isClosed).to.be.false;
      });

      it('repays full principal and partial interest back to pool', async () => {
        const poolId = (await datetime.toDays()).add(new BN(depositTerm));
        const pool = await loanManager.getPoolById(loanToken.address, poolId);
        const loanDistributorFee = repayAmount
          .sub(loanAmount)
          .mul(loanDistributorFeeRatio)
          .div(toFixedBN(1));

        expect(new BN(pool.availableAmount)).to.bignumber.equal(
          repayAmount.sub(loanDistributorFee),
        );
      });

      it('sends no token to distributor', async () => {
        const distributorBalance = await loanToken.balanceOf(
          distributorAddress,
        );

        expect(distributorBalance).to.bignumber.equal(toFixedBN(0));
      });
    });

    context('when repays partial interest only', () => {
      let tx, prevRemainingDebt;
      const repayAmount = toFixedBN(0.01);

      beforeEach(async () => {
        // Repay full principle first
        await loanManager.repayLoan(recordId, loanAmount, {
          from: loaner,
        });

        const loanRecord = await loanManager.getLoanRecordById(recordId);
        prevRemainingDebt = new BN(loanRecord.remainingDebt);

        // Repay interest
        tx = await loanManager.repayLoan(recordId, repayAmount, {
          from: loaner,
        });
      });

      it('emits event', async () => {
        expectEvent.inLogs(tx.logs, 'RepayLoanSucceed', {
          accountAddress: loaner,
          recordId: recordId,
          amount: repayAmount,
        });
      });

      it('updates loan record', async () => {
        const loanRecord = await loanManager.getLoanRecordById(recordId);
        const currRemainingDebt = new BN(loanRecord.remainingDebt);

        expect(currRemainingDebt).to.bignumber.equal(
          prevRemainingDebt.sub(repayAmount),
        );

        expect(loanRecord.isClosed).to.be.false;
      });

      it('repays partial interest back to pool', async () => {
        const poolId = (await datetime.toDays()).add(new BN(depositTerm));
        const pool = await loanManager.getPoolById(loanToken.address, poolId);
        const loanDistributorFee = repayAmount
          .mul(loanDistributorFeeRatio)
          .div(toFixedBN(1));

        expect(new BN(pool.availableAmount)).to.bignumber.equal(
          loanAmount.add(repayAmount).sub(loanDistributorFee),
        );
      });

      it('sends no token to distributor', async () => {
        const distributorBalance = await loanToken.balanceOf(
          distributorAddress,
        );

        expect(distributorBalance).to.bignumber.equal(toFixedBN(0));
      });
    });

    context('when repays full pricipal and full interest', () => {
      let tx, repayAmount;

      beforeEach(async () => {
        const loanRecord = await loanManager.getLoanRecordById(recordId);
        repayAmount = new BN(loanRecord.remainingDebt);

        tx = await loanManager.repayLoan(recordId, repayAmount, {
          from: loaner,
        });
      });

      it('emits event', async () => {
        expectEvent.inLogs(tx.logs, 'RepayLoanSucceed', {
          accountAddress: loaner,
          recordId: recordId,
          amount: repayAmount,
        });
      });

      it('updates loan record', async () => {
        const loanRecord = await loanManager.getLoanRecordById(recordId);

        expect(new BN(loanRecord.remainingDebt)).to.bignumber.equal(new BN(0));

        expect(loanRecord.isClosed).to.be.true;
      });

      let loanDistributorFee;

      it('repays principal and interest back to pool', async () => {
        const poolId = (await datetime.toDays()).add(new BN(depositTerm));
        const pool = await loanManager.getPoolById(loanToken.address, poolId);
        loanDistributorFee = repayAmount
          .sub(loanAmount)
          .mul(loanDistributorFeeRatio)
          .div(toFixedBN(1));

        expect(new BN(pool.availableAmount)).to.bignumber.equal(
          repayAmount.sub(loanDistributorFee),
        );
      });

      it('sends tokens to distributor', async () => {
        const distributorBalance = await loanToken.balanceOf(
          distributorAddress,
        );

        expect(distributorBalance).to.bignumber.equal(loanDistributorFee);
      });
    });
  });

  describe('#liquidateLoan', () => {
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;
    const loanAmount = toFixedBN(10);
    const collateralAmount = toFixedBN(20);
    const loanTerm = 30;
    const liquidationDiscount = toFixedBN(0.05);
    const prevLoanTokenPrice = toFixedBN(10);
    const prevCollateralTokenPrice = toFixedBN(10);
    let recordId,
      prevProtocolLoanBalance,
      prevProtocolCollateralBalance,
      prevLiquidatorLoanBalance,
      prevLiquidatorCollateralBalance,
      prevLoanerCollateralBalance;

    beforeEach(async () => {
      await loanToken.mint(liquidator, initialSupply);
      await priceOracle.setPrice(prevLoanTokenPrice);
      await collateralPriceOracle.setPrice(prevCollateralTokenPrice);
      await loanManager.setPriceOracle(loanToken.address, priceOracle.address);
      await loanManager.setPriceOracle(
        collateralToken.address,
        collateralPriceOracle.address,
      );
      await loanManager.enableDepositToken(loanToken.address);
      await setLoanAndCollateralTokenPair();
      await loanManager.enableDepositTerm(depositTerm);

      await loanToken.approve(loanManager.address, initialSupply, {
        from: depositor,
      });

      await collateralToken.approve(loanManager.address, initialSupply, {
        from: loaner,
      });

      await loanManager.deposit(
        loanToken.address,
        depositAmount,
        depositTerm,
        distributorAddress,
        {
          from: depositor,
        },
      );

      const { logs } = await loanManager.loan(
        loanToken.address,
        collateralToken.address,
        loanAmount,
        collateralAmount,
        loanTerm,
        distributorAddress,
        {
          from: loaner,
        },
      );

      recordId = logs.filter(log => log.event === 'LoanSucceed')[0].args
        .recordId;

      prevProtocolLoanBalance = await loanToken.balanceOf(loanManager.address);
      prevProtocolCollateralBalance = await collateralToken.balanceOf(
        loanManager.address,
      );
      prevLiquidatorLoanBalance = await loanToken.balanceOf(liquidator);
      prevLiquidatorCollateralBalance = await collateralToken.balanceOf(
        liquidator,
      );
      prevLoanerCollateralBalance = await collateralToken.balanceOf(loaner);
    });

    context('when liquidator is not owner', () => {
      it('reverts', async () => {
        await expectRevert(
          loanManager.liquidateLoan(recordId, new BN(1), { from: loaner }),
          'LoanManager: invalid user',
        );
      });
    });

    context('when not liquidatable', () => {
      it('reverts', async () => {
        await expectRevert(
          loanManager.liquidateLoan(recordId, new BN(1), { from: liquidator }),
          'LoanManager: not liquidatable',
        );
      });
    });

    context(
      'when collateral coverage ratio below min collateral coverage ratio',
      () => {
        const currCollateralTokenPrice = toFixedBN(7);
        let prevLoanRecord;

        beforeEach(async () => {
          await collateralPriceOracle.setPrice(currCollateralTokenPrice);

          prevLoanRecord = await loanManager.getLoanRecordById(recordId);

          await loanToken.approve(
            loanManager.address,
            new BN(prevLoanRecord.remainingDebt),
            {
              from: liquidator,
            },
          );
        });

        context('when liquidates partially', () => {
          const liquidateAmount = loanAmount.sub(toFixedBN(2));
          let tx, soldCollateralAmount;

          beforeEach(async () => {
            tx = await loanManager.liquidateLoan(recordId, liquidateAmount, {
              from: liquidator,
            });
          });

          it('emits event', async () => {
            expectEvent.inLogs(tx.logs, 'LiquidateLoanSucceed', {
              accountAddress: liquidator,
              recordId: recordId,
              amount: liquidateAmount,
            });
          });

          it('updates loan record', async () => {
            const currLoanRecord = await loanManager.getLoanRecordById(
              recordId,
            );

            soldCollateralAmount = new BN(currLoanRecord.soldCollateralAmount);

            expect(new BN(currLoanRecord.remainingDebt)).to.bignumber.equal(
              new BN(prevLoanRecord.remainingDebt).sub(liquidateAmount),
            );

            expect(currLoanRecord.isClosed).to.be.false;

            expect(soldCollateralAmount).to.bignumber.equal(
              liquidateAmount
                .mul(prevLoanTokenPrice)
                .div(currCollateralTokenPrice)
                .mul(toFixedBN(1))
                .div(toFixedBN(1).sub(liquidationDiscount)),
            );
          });

          it('reduces loan tokens from liquidator', async () => {
            const currLiquidatorBalance = await loanToken.balanceOf(liquidator);

            expect(currLiquidatorBalance).to.bignumber.equal(
              prevLiquidatorLoanBalance.sub(liquidateAmount),
            );
          });

          it('adds loan tokens to protocol', async () => {
            const currProtocolBalance = await loanToken.balanceOf(
              loanManager.address,
            );

            expect(currProtocolBalance).to.bignumber.equal(
              prevProtocolLoanBalance.add(liquidateAmount),
            );
          });

          it('adds sold collateral tokens to liquidator', async () => {
            const currLiquidatorBalance = await collateralToken.balanceOf(
              liquidator,
            );

            expect(currLiquidatorBalance).to.bignumber.equal(
              prevLiquidatorCollateralBalance.add(soldCollateralAmount),
            );
          });

          it('reduces sold collateral tokens from protocol', async () => {
            const currProtocolBalance = await collateralToken.balanceOf(
              loanManager.address,
            );

            expect(currProtocolBalance).to.bignumber.equal(
              prevProtocolCollateralBalance.sub(soldCollateralAmount),
            );
          });

          it('does not return collateral tokens to loaner', async () => {
            const currLoanerBalance = await collateralToken.balanceOf(loaner);

            expect(currLoanerBalance).to.bignumber.equal(
              prevLoanerCollateralBalance,
            );
          });
        });

        context('when liquidates fully', () => {
          let tx, liquidateAmount, soldCollateralAmount;

          beforeEach(async () => {
            const prevLoanRecord = await loanManager.getLoanRecordById(
              recordId,
            );

            liquidateAmount = new BN(prevLoanRecord.remainingDebt);

            tx = await loanManager.liquidateLoan(recordId, liquidateAmount, {
              from: liquidator,
            });
          });

          it('emits event', async () => {
            expectEvent.inLogs(tx.logs, 'LiquidateLoanSucceed', {
              accountAddress: liquidator,
              recordId: recordId,
              amount: liquidateAmount,
            });
          });

          it('updates loan record', async () => {
            const currLoanRecord = await loanManager.getLoanRecordById(
              recordId,
            );
            soldCollateralAmount = new BN(currLoanRecord.soldCollateralAmount);

            expect(new BN(currLoanRecord.remainingDebt)).to.bignumber.equal(
              new BN(prevLoanRecord.remainingDebt).sub(liquidateAmount),
            );

            expect(currLoanRecord.isClosed).to.be.true;

            expect(soldCollateralAmount).to.bignumber.equal(
              liquidateAmount
                .mul(prevLoanTokenPrice)
                .div(currCollateralTokenPrice)
                .mul(toFixedBN(1))
                .div(toFixedBN(1).sub(liquidationDiscount)),
            );
          });

          it('reduces loan tokens from liquidator', async () => {
            const currLiquidatorBalance = await loanToken.balanceOf(liquidator);

            expect(currLiquidatorBalance).to.bignumber.equal(
              prevLiquidatorLoanBalance.sub(liquidateAmount),
            );
          });

          it('adds loan tokens to protocol', async () => {
            const currProtocolBalance = await loanToken.balanceOf(
              loanManager.address,
            );

            expect(currProtocolBalance).to.bignumber.equal(
              prevProtocolLoanBalance.add(liquidateAmount),
            );
          });

          it('adds sold collateral tokens to liquidator', async () => {
            const currLiquidatorBalance = await collateralToken.balanceOf(
              liquidator,
            );

            expect(currLiquidatorBalance).to.bignumber.equal(
              prevLiquidatorCollateralBalance.add(soldCollateralAmount),
            );
          });

          it('reduces all collateral tokens from protocol', async () => {
            const currProtocolBalance = await collateralToken.balanceOf(
              loanManager.address,
            );

            expect(currProtocolBalance).to.bignumber.equal(
              prevProtocolCollateralBalance.sub(collateralAmount),
            );
          });

          it('returns remaining collateral tokens to loaner', async () => {
            const currLoanerBalance = await collateralToken.balanceOf(loaner);
            const remainingCollateralAmount = collateralAmount.sub(
              soldCollateralAmount,
            );

            expect(currLoanerBalance).to.bignumber.equal(
              prevLoanerCollateralBalance.add(remainingCollateralAmount),
            );
          });
        });
      },
    );

    context('when loan is defaulted', () => {
      let prevLoanRecord;

      beforeEach(async () => {
        await time.increase(time.duration.days(loanTerm + 1));

        prevLoanRecord = await loanManager.getLoanRecordById(recordId);

        await loanToken.approve(
          loanManager.address,
          new BN(prevLoanRecord.remainingDebt),
          {
            from: liquidator,
          },
        );
      });

      context('when liquidates partially', () => {
        const liquidateAmount = loanAmount.sub(toFixedBN(2));
        let tx, soldCollateralAmount;

        beforeEach(async () => {
          tx = await loanManager.liquidateLoan(recordId, liquidateAmount, {
            from: liquidator,
          });
        });

        it('emits event', async () => {
          expectEvent.inLogs(tx.logs, 'LiquidateLoanSucceed', {
            accountAddress: liquidator,
            recordId: recordId,
            amount: liquidateAmount,
          });
        });

        it('updates loan record', async () => {
          const currLoanRecord = await loanManager.getLoanRecordById(recordId);

          soldCollateralAmount = new BN(currLoanRecord.soldCollateralAmount);

          expect(new BN(currLoanRecord.remainingDebt)).to.bignumber.equal(
            new BN(prevLoanRecord.remainingDebt).sub(liquidateAmount),
          );

          expect(currLoanRecord.isClosed).to.be.false;

          expect(soldCollateralAmount).to.bignumber.equal(
            liquidateAmount
              .mul(prevLoanTokenPrice)
              .div(prevCollateralTokenPrice)
              .mul(toFixedBN(1))
              .div(toFixedBN(1).sub(liquidationDiscount)),
          );
        });

        it('reduces loan tokens from liquidator', async () => {
          const currLiquidatorBalance = await loanToken.balanceOf(liquidator);

          expect(currLiquidatorBalance).to.bignumber.equal(
            prevLiquidatorLoanBalance.sub(liquidateAmount),
          );
        });

        it('adds loan tokens to protocol', async () => {
          const currProtocolBalance = await loanToken.balanceOf(
            loanManager.address,
          );

          expect(currProtocolBalance).to.bignumber.equal(
            prevProtocolLoanBalance.add(liquidateAmount),
          );
        });

        it('adds sold collateral tokens to liquidator', async () => {
          const currLiquidatorBalance = await collateralToken.balanceOf(
            liquidator,
          );

          expect(currLiquidatorBalance).to.bignumber.equal(
            prevLiquidatorCollateralBalance.add(soldCollateralAmount),
          );
        });

        it('reduces sold collateral tokens from protocol', async () => {
          const currProtocolBalance = await collateralToken.balanceOf(
            loanManager.address,
          );

          expect(currProtocolBalance).to.bignumber.equal(
            prevProtocolCollateralBalance.sub(soldCollateralAmount),
          );
        });

        it('does not return collateral tokens to loaner', async () => {
          const currLoanerBalance = await collateralToken.balanceOf(loaner);

          expect(currLoanerBalance).to.bignumber.equal(
            prevLoanerCollateralBalance,
          );
        });
      });

      context('when liquidates fully', () => {
        let tx, liquidateAmount, soldCollateralAmount;

        beforeEach(async () => {
          const prevLoanRecord = await loanManager.getLoanRecordById(recordId);

          liquidateAmount = new BN(prevLoanRecord.remainingDebt);

          tx = await loanManager.liquidateLoan(recordId, liquidateAmount, {
            from: liquidator,
          });
        });

        it('emits event', async () => {
          expectEvent.inLogs(tx.logs, 'LiquidateLoanSucceed', {
            accountAddress: liquidator,
            recordId: recordId,
            amount: liquidateAmount,
          });
        });

        it('updates loan record', async () => {
          const currLoanRecord = await loanManager.getLoanRecordById(recordId);
          soldCollateralAmount = new BN(currLoanRecord.soldCollateralAmount);

          expect(new BN(currLoanRecord.remainingDebt)).to.bignumber.equal(
            new BN(prevLoanRecord.remainingDebt).sub(liquidateAmount),
          );

          expect(currLoanRecord.isClosed).to.be.true;

          expect(soldCollateralAmount).to.bignumber.equal(
            liquidateAmount
              .mul(prevLoanTokenPrice)
              .div(prevCollateralTokenPrice)
              .mul(toFixedBN(1))
              .div(toFixedBN(1).sub(liquidationDiscount)),
          );
        });

        it('reduces loan tokens from liquidator', async () => {
          const currLiquidatorBalance = await loanToken.balanceOf(liquidator);

          expect(currLiquidatorBalance).to.bignumber.equal(
            prevLiquidatorLoanBalance.sub(liquidateAmount),
          );
        });

        it('adds loan tokens to protocol', async () => {
          const currProtocolBalance = await loanToken.balanceOf(
            loanManager.address,
          );

          expect(currProtocolBalance).to.bignumber.equal(
            prevProtocolLoanBalance.add(liquidateAmount),
          );
        });

        it('adds sold collateral tokens to liquidator', async () => {
          const currLiquidatorBalance = await collateralToken.balanceOf(
            liquidator,
          );

          expect(currLiquidatorBalance).to.bignumber.equal(
            prevLiquidatorCollateralBalance.add(soldCollateralAmount),
          );
        });

        it('reduces all collateral tokens from protocol', async () => {
          const currProtocolBalance = await collateralToken.balanceOf(
            loanManager.address,
          );

          expect(currProtocolBalance).to.bignumber.equal(
            prevProtocolCollateralBalance.sub(collateralAmount),
          );
        });

        it('returns remaining collateral tokens to loaner', async () => {
          const currLoanerBalance = await collateralToken.balanceOf(loaner);
          const remainingCollateralAmount = collateralAmount.sub(
            soldCollateralAmount,
          );

          expect(currLoanerBalance).to.bignumber.equal(
            prevLoanerCollateralBalance.add(remainingCollateralAmount),
          );
        });
      });
    });
  });

  describe('#getLoanAndCollateralTokenPairs', () => {
    let collateralToken1;

    beforeEach(async () => {
      collateralToken1 = await createERC20Token(loaner, initialSupply);
    });

    context('when not set token pairs', () => {
      it('succeeds', async () => {
        let result = await loanManager.getLoanAndCollateralTokenPairs();
        expect(result.length).to.equal(0);
      });
    });

    context('when set token pairs', () => {
      it('succeeds', async () => {
        let loanTokenAddress = loanToken.address,
          collateralTokenAddressList = [
            collateralToken.address,
            collateralToken1.address,
          ],
          minCollateralCoverageRatioList = [toFixedBN(1.5), toFixedBN(1.1)],
          liquidationDiscountList = [toFixedBN(0.03), toFixedBN(0.01)];
        await loanManager.setLoanAndCollateralTokenPair(
          loanTokenAddress,
          collateralToken.address,
          minCollateralCoverageRatioList[0],
          liquidationDiscountList[0],
        );
        await loanManager.setLoanAndCollateralTokenPair(
          loanTokenAddress,
          collateralToken1.address,
          minCollateralCoverageRatioList[1],
          liquidationDiscountList[1],
        );

        let tokenPairs = await loanManager.getLoanAndCollateralTokenPairs();

        for (let i = 0; i < tokenPairs.length; i++) {
          const tokenPair = tokenPairs[i];
          expect(tokenPair.loanTokenAddress).to.equal(loanTokenAddress);
          expect(tokenPair.collateralTokenAddress).to.equal(
            collateralTokenAddressList[i],
          );
          expect(
            new BN(tokenPair.minCollateralCoverageRatio),
          ).to.bignumber.equal(minCollateralCoverageRatioList[i]);
          expect(new BN(tokenPair.liquidationDiscount)).to.bignumber.equal(
            liquidationDiscountList[i],
          );
        }
      });
    });
  });

  describe('#getLoanInterestRate', () => {
    const loanTerm = 30;

    beforeEach(async () => {
      await loanManager.setLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
        minCollateralCoverageRatio,
        liquidationDiscount,
      );
    });

    it('succeeds', async () => {
      await loanManager.setPoolGroupSizeIfNeeded(loanToken.address, loanTerm);

      // TODO(ZhangRGK): expect to the model result
      await loanManager.getLoanInterestRate(loanToken.address, loanTerm);
    });
  });
});
