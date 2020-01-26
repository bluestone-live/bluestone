const LoanManager = artifacts.require('LoanManagerMock');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const InterestModel = artifacts.require('InterestModel');
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
  let loanManager, priceOracle, interestModel, payableProxy;
  const depositDistributorFeeRatio = toFixedBN(0.01);
  const loanDistributorFeeRatio = toFixedBN(0.02);
  const minCollateralCoverageRatio = toFixedBN(1.2);
  const liquidationDiscount = toFixedBN(0.05);

  let weth;

  beforeEach(async () => {
    loanManager = await LoanManager.new();
    priceOracle = await SingleFeedPriceOracle.new();
    interestModel = await InterestModel.new();

    weth = await WETH9.new();
    await loanManager.setInterestModel(interestModel.address);
    await loanManager.setMaxDistributorFeeRatios(
      depositDistributorFeeRatio,
      loanDistributorFeeRatio,
    );
    payableProxy = await PayableProxy.new(loanManager.address, weth.address);

    await loanManager.setPayableProxy(payableProxy.address);
  });

  describe('#getLoanRecordById', () => {
    context('when loan id is valid', () => {
      const initialSupply = toFixedBN(1000);
      const depositAmount = toFixedBN(10);
      const depositTerm = 30;
      const loanAmount = toFixedBN(10);
      const collateralAmount = toFixedBN(30);
      const loanTerm = 30;

      let loanToken, collateralToken, recordId;

      beforeEach(async () => {
        loanToken = await createERC20Token(depositor, initialSupply);
        collateralToken = await createERC20Token(loaner, initialSupply);
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
      const initialSupply = toFixedBN(1000);
      const depositAmount = toFixedBN(10);
      const depositTerm = 30;
      const loanAmount = toFixedBN(10);
      const collateralAmount = toFixedBN(30);
      const loanTerm = 30;

      let loanToken, collateralToken;

      beforeEach(async () => {
        loanToken = await createERC20Token(depositor, initialSupply);
        collateralToken = await createERC20Token(loaner, initialSupply);
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
    const initialSupply = toFixedBN(1000);
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;
    const loanAmount = toFixedBN(10);
    const collateralAmount = toFixedBN(30);
    const loanTerm = 30;

    let loanToken, collateralToken, recordId, ETHRecordId;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
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

      await loanManager.setLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
        minCollateralCoverageRatio,
        liquidationDiscount,
      );

      await loanManager.setLoanAndCollateralTokenPair(
        loanToken.address,
        ETHIdentificationAddress,
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

      const { logs: logs2 } = await loanManager.loan(
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

      ETHRecordId = logs2.filter(log => log.event === 'LoanSucceed')[0].args
        .recordId;
    });

    it('succeeds', async () => {
      const collateralAmount = toFixedBN(10);
      const { logs } = await loanManager.addCollateral(
        recordId,
        collateralAmount,
        {
          from: loaner,
        },
      );

      const { logs: logs2 } = await loanManager.addCollateral(
        ETHRecordId,
        toFixedBN(0),
        {
          from: loaner,
          value: collateralAmount,
        },
      );

      expectEvent.inLogs(logs, 'AddCollateralSucceed', {
        accountAddress: loaner,
        recordId,
        collateralAmount,
      });

      expectEvent.inLogs(logs2, 'AddCollateralSucceed', {
        accountAddress: loaner,
        recordId: ETHRecordId,
        collateralAmount,
      });
    });
  });

  describe('#setLoanAndCollateralTokenPair', () => {
    const initialSupply = toFixedBN(1000);
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
    });

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
    const initialSupply = toFixedBN(1000);
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
    });

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
    const initialSupply = toFixedBN(1000);
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
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

    context('when loan and collateral token pair is enabled', () => {
      beforeEach(async () => {
        await loanManager.setLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
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
    const initialSupply = toFixedBN(1000);
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;
    const loanAmount = toFixedBN(10);
    const collateralAmount = toFixedBN(30);
    const loanTerm = 30;
    let loanToken, collateralToken, recordId, ETHRecordId;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
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
      await loanManager.setLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
        minCollateralCoverageRatio,
        liquidationDiscount,
        { from: owner },
      );
      await loanManager.setLoanAndCollateralTokenPair(
        loanToken.address,
        ETHIdentificationAddress,
        minCollateralCoverageRatio,
        liquidationDiscount,
        { from: owner },
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
        depositAmount.mul(new BN(2)),
        depositTerm,
        distributorAddress,
        {
          from: depositor,
        },
      );

      const { logs: logs1 } = await loanManager.loan(
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

      recordId = logs1.filter(log => log.event === 'LoanSucceed')[0].args
        .recordId;

      const { logs: logs2 } = await loanManager.loan(
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

      ETHRecordId = logs2.filter(log => log.event === 'LoanSucceed')[0].args
        .recordId;
    });

    // How about if a loan pair disabled?
    context('when loan and collateral token pair is enabled', () => {
      it('repays fully', async () => {
        const prevLoanRecord = await loanManager.getLoanRecordById(recordId);
        const prevETHLoanRecord = await loanManager.getLoanRecordById(
          ETHRecordId,
        );
        const prevDistributorBalance = await loanToken.balanceOf(
          distributorAddress,
        );

        await loanToken.approve(
          loanManager.address,
          new BN(prevLoanRecord.remainingDebt).add(
            new BN(prevETHLoanRecord.remainingDebt),
          ),
          {
            from: loaner,
          },
        );

        const { logs: logs1 } = await loanManager.repayLoan(
          recordId,
          prevLoanRecord.remainingDebt,
          { from: loaner },
        );

        expectEvent.inLogs(logs1, 'RepayLoanSucceed', {
          accountAddress: loaner,
          recordId: recordId,
        });

        const { logs: logs2 } = await loanManager.repayLoan(
          ETHRecordId,
          prevETHLoanRecord.remainingDebt,
          { from: loaner },
        );

        expectEvent.inLogs(logs2, 'RepayLoanSucceed', {
          accountAddress: loaner,
          recordId: ETHRecordId,
        });

        const currLoanRecord = await loanManager.getLoanRecordById(recordId);
        expect(new BN(currLoanRecord.remainingDebt)).to.bignumber.equal(
          new BN(0),
        );
        expect(currLoanRecord.isClosed).to.be.true;
        expect(
          await loanToken.balanceOf(distributorAddress),
        ).to.bignumber.equal(
          new BN(prevDistributorBalance).add(
            new BN(prevLoanRecord.remainingDebt)
              .sub(new BN(loanAmount))
              .mul(loanDistributorFeeRatio),
          ),
        );
      });
    });
  });

  describe('#liquidateLoan', () => {
    const initialSupply = toFixedBN(1000);
    const depositAmount = toFixedBN(10);
    const depositTerm = 30;
    const loanAmount = toFixedBN(10);
    const collateralAmount = toFixedBN(30);
    const loanTerm = 30;
    let loanToken, collateralToken, recordId, ETHRecordId;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
      await loanToken.mint(liquidator, initialSupply);
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
      await loanManager.setLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
        minCollateralCoverageRatio,
        liquidationDiscount,
        { from: owner },
      );
      await loanManager.setLoanAndCollateralTokenPair(
        loanToken.address,
        ETHIdentificationAddress,
        minCollateralCoverageRatio,
        liquidationDiscount,
        { from: owner },
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
        depositAmount.mul(new BN(2)),
        depositTerm,
        distributorAddress,
        {
          from: depositor,
        },
      );

      const { logs: logs1 } = await loanManager.loan(
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

      recordId = logs1.filter(log => log.event === 'LoanSucceed')[0].args
        .recordId;

      const { logs: logs2 } = await loanManager.loan(
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

      ETHRecordId = logs2.filter(log => log.event === 'LoanSucceed')[0].args
        .recordId;
    });

    context('when loan is defaulted', () => {
      beforeEach(async () => {
        await time.increase(time.duration.days(loanTerm + 1));
      });

      it('liquidates fully', async () => {
        const prevLoanRecord = await loanManager.getLoanRecordById(recordId);
        const prevETHLoanRecord = await loanManager.getLoanRecordById(
          ETHRecordId,
        );

        await loanToken.approve(
          loanManager.address,
          new BN(prevLoanRecord.remainingDebt).add(
            new BN(prevETHLoanRecord.remainingDebt),
          ),
          {
            from: liquidator,
          },
        );

        const { logs } = await loanManager.liquidateLoan(
          recordId,
          prevLoanRecord.remainingDebt,
          { from: liquidator },
        );

        expectEvent.inLogs(logs, 'LiquidateLoanSucceed', {
          accountAddress: liquidator,
          recordId: recordId,
        });

        const { logs: logs2 } = await loanManager.liquidateLoan(
          ETHRecordId,
          prevETHLoanRecord.remainingDebt,
          { from: liquidator },
        );

        expectEvent.inLogs(logs, 'LiquidateLoanSucceed', {
          accountAddress: liquidator,
          recordId: recordId,
        });

        expectEvent.inLogs(logs2, 'LiquidateLoanSucceed', {
          accountAddress: liquidator,
          recordId: ETHRecordId,
        });

        const currLoanRecord = await loanManager.getLoanRecordById(recordId);
        expect(new BN(currLoanRecord.remainingDebt)).to.bignumber.equal(
          new BN(0),
        );
        expect(currLoanRecord.isClosed).to.be.true;
      });
    });
  });

  describe('#getLoanAndCollateralTokenPairs', () => {
    const initialSupply = toFixedBN(1000);
    let loanToken, collateralToken, collateralToken1;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
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
    const initialSupply = toFixedBN(1000);
    const loanTerm = 30;
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);

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
