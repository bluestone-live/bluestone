const LoanManager = artifacts.require('LoanManagerMock');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const InterestModel = artifacts.require('InterestModel');
const WETH9 = artifacts.require('WETH9');
const {
  toFixedBN,
  createERC20Token,
  ETHIdentificationAddress,
} = require('../../utils/index.js');
const PayableProxy = artifacts.require('PayableProxyMock');
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

  const ZEROAddress = '0x0000000000000000000000000000000000000000';
  let weth;

  beforeEach(async () => {
    loanManager = await LoanManager.new();
    priceOracle = await SingleFeedPriceOracle.new();
    interestModel = await InterestModel.new();
    payableProxy = await PayableProxy.new(loanManager.address);

    weth = await WETH9.new();
    await loanManager.setInterestModel(interestModel.address);
    await loanManager.setMaxDistributorFeeRatios(
      depositDistributorFeeRatio,
      loanDistributorFeeRatio,
    );
    await payableProxy.setWETHAddress(weth.address);

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

        await loanManager.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
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
          'LoanManager: Loan ID is invalid',
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

        await loanManager.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
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

      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
      );

      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        ETHIdentificationAddress,
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

  describe('#enableLoanAndCollateralTokenPair', () => {
    const initialSupply = toFixedBN(1000);
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
    });

    context('when loan and collateral token are the same', () => {
      it('reverts', async () => {
        await expectRevert(
          loanManager.enableLoanAndCollateralTokenPair(
            loanToken.address,
            loanToken.address,
            { from: owner },
          ),
          'LoanManager: two tokens must be different.',
        );
      });
    });

    context('when loan and collateral token are different', () => {
      it('success', async () => {
        // TODO(lambda): test it after finish getLoanAndCollateralTokenPairs method.
        await loanManager.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
      });
    });

    context('when the pair already exists', () => {
      it('reverts', async () => {
        await loanManager.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
        await expectRevert(
          loanManager.enableLoanAndCollateralTokenPair(
            loanToken.address,
            collateralToken.address,
            { from: owner },
          ),
          'LoanManager: loan token pair is already enabled.',
        );
      });
    });
  });

  describe('#disableLoanAndCollateralTokenPair', () => {
    const initialSupply = toFixedBN(1000);
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
    });

    context('when the pair does not exist', () => {
      it('reverts', async () => {
        await expectRevert(
          loanManager.disableLoanAndCollateralTokenPair(
            loanToken.address,
            collateralToken.address,
            { from: owner },
          ),
          'LoanManager: loan token pair is already disabled.',
        );
      });
    });

    context('when the pair are disabled after being enabled', () => {
      it('success', async () => {
        // TODO(lambda): test it after finish getLoanAndCollateralTokenPairs method.
        await loanManager.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
        await loanManager.disableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
      });
    });

    context('when the pair is already disabled', () => {
      it('reverts', async () => {
        await loanManager.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
        await loanManager.disableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
        await expectRevert(
          loanManager.disableLoanAndCollateralTokenPair(
            loanToken.address,
            collateralToken.address,
            { from: owner },
          ),
          'LoanManager: loan token pair is already disabled.',
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
        await loanManager.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
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
        await loanManager.enableLoanAndCollateralTokenPair(
          loanToken.address,
          ETHIdentificationAddress,
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
      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
        { from: owner },
      );
      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        ETHIdentificationAddress,
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
      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
        { from: owner },
      );
      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        ETHIdentificationAddress,
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

  describe('#setMinCollateralCoverageRatiosForToken', () => {
    const initialSupply = toFixedBN(1000);
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
    });

    context("when arrays' lengths are different", () => {
      let loanTokenAddress,
        collateralTokenAddressList,
        minCollateralCoverageRatioList;

      beforeEach(async () => {
        loanTokenAddress = loanToken.address;
        collateralTokenAddressList = [collateralToken.address];
        minCollateralCoverageRatioList = [toFixedBN(1.5), toFixedBN(1.1)];
      });

      it('reverts', async () => {
        await expectRevert(
          loanManager.setMinCollateralCoverageRatiosForToken(
            loanTokenAddress,
            collateralTokenAddressList,
            minCollateralCoverageRatioList,
          ),
          "LoanManager: Arrays' length must be the same.",
        );
      });

      it('reverts', async () => {
        await collateralTokenAddressList.push(loanToken.address);
        await minCollateralCoverageRatioList.pop();
        await expectRevert(
          loanManager.setMinCollateralCoverageRatiosForToken(
            loanTokenAddress,
            collateralTokenAddressList,
            minCollateralCoverageRatioList,
          ),
          "LoanManager: Arrays' length must be the same.",
        );
      });
    });

    context('when some pairs are not enabled', () => {
      let loanTokenAddress,
        collateralTokenAddressList,
        minCollateralCoverageRatioList;

      beforeEach(async () => {
        loanTokenAddress = loanToken.address;
        collateralTokenAddressList = [loanToken.address];
        minCollateralCoverageRatioList = [toFixedBN(1.5)];
      });

      it('reverts', async () => {
        await expectRevert(
          loanManager.setMinCollateralCoverageRatiosForToken(
            loanTokenAddress,
            collateralTokenAddressList,
            minCollateralCoverageRatioList,
          ),
          'LoanManager: The token pair must be enabled.',
        );
      });
    });

    context(
      'when the collateral coverage ratio is equal or small than lower bound',
      () => {
        let loanTokenAddress,
          collateralTokenAddressList,
          minCollateralCoverageRatioList;

        beforeEach(async () => {
          loanTokenAddress = loanToken.address;
          collateralTokenAddressList = [collateralToken.address];
          minCollateralCoverageRatioList = [toFixedBN(1)];
          await loanManager.enableLoanAndCollateralTokenPair(
            loanTokenAddress,
            collateralTokenAddressList[0],
          );
        });

        it('reverts', async () => {
          await expectRevert(
            loanManager.setMinCollateralCoverageRatiosForToken(
              loanTokenAddress,
              collateralTokenAddressList,
              minCollateralCoverageRatioList,
            ),
            'LoanManager: Minimum CCR must be larger than lower bound.',
          );
        });
      },
    );

    context('when minimum collateral coverage ratios are added', () => {
      let loanTokenAddress,
        collateralTokenAddressList,
        minCollateralCoverageRatioList;

      beforeEach(async () => {
        loanTokenAddress = loanToken.address;
        collateralTokenAddressList = [collateralToken.address];
        minCollateralCoverageRatioList = [toFixedBN(1.5)];
        await loanManager.enableLoanAndCollateralTokenPair(
          loanTokenAddress,
          collateralTokenAddressList[0],
        );
      });

      it('succeeds', async () => {
        await loanManager.setMinCollateralCoverageRatiosForToken(
          loanTokenAddress,
          collateralTokenAddressList,
          minCollateralCoverageRatioList,
        );
        // TODO(lambda): test it after finish getLoanAndCollateralTokenPairs method.
      });
    });
  });

  describe('#setLiquidationDiscountsForToken', () => {
    const initialSupply = toFixedBN(1000);
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
    });

    context("when arrays' lengths are different", () => {
      let loanTokenAddress, collateralTokenAddressList, liquidationDiscountList;

      beforeEach(async () => {
        loanTokenAddress = loanToken.address;
        collateralTokenAddressList = [collateralToken.address];
        liquidationDiscountList = [toFixedBN(0.95), toFixedBN(0.9)];
      });

      it('reverts', async () => {
        await expectRevert(
          loanManager.setLiquidationDiscountsForToken(
            loanTokenAddress,
            collateralTokenAddressList,
            liquidationDiscountList,
          ),
          "LoanManager: Arrays' length must be the same.",
        );
      });

      it('reverts', async () => {
        await collateralTokenAddressList.push(loanToken.address);
        await liquidationDiscountList.pop();
        await expectRevert(
          loanManager.setLiquidationDiscountsForToken(
            loanTokenAddress,
            collateralTokenAddressList,
            liquidationDiscountList,
          ),
          "LoanManager: Arrays' length must be the same.",
        );
      });
    });

    context('when some pairs are not enabled', () => {
      let loanTokenAddress, collateralTokenAddressList, liquidationDiscountList;

      beforeEach(async () => {
        loanTokenAddress = loanToken.address;
        collateralTokenAddressList = [loanToken.address];
        liquidationDiscountList = [toFixedBN(0.9)];
      });

      it('reverts', async () => {
        await expectRevert(
          loanManager.setLiquidationDiscountsForToken(
            loanTokenAddress,
            collateralTokenAddressList,
            liquidationDiscountList,
          ),
          'LoanManager: The token pair must be enabled.',
        );
      });
    });

    context('when the liquidation discount >= MAX_LIQUIDATION_DISCOUNT', () => {
      let loanTokenAddress,
        collateralTokenAddressList,
        liquidationDiscountList0,
        liquidationDiscountList1;

      beforeEach(async () => {
        loanTokenAddress = loanToken.address;
        collateralTokenAddressList = [collateralToken.address];
        liquidationDiscountList0 = [toFixedBN(0.2)];
        liquidationDiscountList1 = [toFixedBN(0.5)];
        await loanManager.enableLoanAndCollateralTokenPair(
          loanTokenAddress,
          collateralTokenAddressList[0],
        );
      });

      it('reverts', async () => {
        await expectRevert(
          loanManager.setLiquidationDiscountsForToken(
            loanTokenAddress,
            collateralTokenAddressList,
            liquidationDiscountList0,
          ),
          'LoanManager: discount must be smaller than MAX_LIQUIDATION_DISCOUNT.',
        );
      });

      it('reverts', async () => {
        await expectRevert(
          loanManager.setLiquidationDiscountsForToken(
            loanTokenAddress,
            collateralTokenAddressList,
            liquidationDiscountList1,
          ),
          'LoanManager: discount must be smaller than MAX_LIQUIDATION_DISCOUNT.',
        );
      });
    });

    context('when token pairs are enabled', () => {
      let loanTokenAddress, collateralTokenAddressList, liquidationDiscountList;

      beforeEach(async () => {
        loanTokenAddress = loanToken.address;
        collateralTokenAddressList = [collateralToken.address];
        liquidationDiscountList = [toFixedBN(0.03)];
        await loanManager.enableLoanAndCollateralTokenPair(
          loanTokenAddress,
          collateralTokenAddressList[0],
        );
      });

      it('succeeds', async () => {
        await loanManager.setLiquidationDiscountsForToken(
          loanTokenAddress,
          collateralTokenAddressList,
          liquidationDiscountList,
        );
        // TODO(lambda): test it after finish getLoanAndCollateralTokenPairs method.
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
        await loanManager.enableLoanAndCollateralTokenPair(
          loanTokenAddress,
          collateralToken.address,
        );
        await loanManager.enableLoanAndCollateralTokenPair(
          loanTokenAddress,
          collateralToken1.address,
        );
        await loanManager.setMinCollateralCoverageRatiosForToken(
          loanTokenAddress,
          collateralTokenAddressList,
          minCollateralCoverageRatioList,
        );
        await loanManager.setLiquidationDiscountsForToken(
          loanTokenAddress,
          collateralTokenAddressList,
          liquidationDiscountList,
        );

        let tokenPairs = await loanManager.getLoanAndCollateralTokenPairs();

        for (let i = 0; i < tokenPairs.length; i++) {
          const tokenPair = tokenPairs[i];
          expect(tokenPair.isEnabled).to.be.true;
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

  describe('#getTokenAddressList', () => {
    const LOAN_TYPE = 0;
    const COLLATERAL_TYPE = 1;
    const initialSupply = toFixedBN(1000);
    let loanToken, collateralToken, collateralToken1;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
      collateralToken1 = await createERC20Token(loaner, initialSupply);
    });

    context('when no token pair is enabled', () => {
      it('succeeds', async () => {
        let {
          loanList,
          isLoanTokensActive,
        } = await loanManager.getTokenAddressList(LOAN_TYPE);
        let {
          collateralList,
          isCollateralTokensActive,
        } = await loanManager.getTokenAddressList(COLLATERAL_TYPE);
        expect(loanList).to.be.undefined;
        expect(isLoanTokensActive).to.be.undefined;
        expect(collateralList).to.be.undefined;
        expect(isCollateralTokensActive).to.be.undefined;
      });
    });

    context('when loan and collateral tokens are enabled', () => {
      it('succeeds', async () => {
        await loanManager.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
        );
        await loanManager.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken1.address,
        );
        loanResult = await loanManager.getTokenAddressList(LOAN_TYPE);
        collateralResult = await loanManager.getTokenAddressList(
          COLLATERAL_TYPE,
        );
        expect(loanResult.tokenAddressList).to.have.members([
          loanToken.address,
        ]);
        expect(loanResult.isActive).to.have.members([true]);
        expect(collateralResult.tokenAddressList).to.have.members([
          collateralToken.address,
          collateralToken1.address,
        ]);
        expect(collateralResult.isActive).to.have.members([true, true]);
      });
    });

    context(
      'when loan and collateral tokens are disabled after being enabled',
      () => {
        it('succeeds', async () => {
          await loanManager.enableLoanAndCollateralTokenPair(
            loanToken.address,
            collateralToken.address,
          );
          await loanManager.enableLoanAndCollateralTokenPair(
            loanToken.address,
            collateralToken1.address,
          );
          await loanManager.disableLoanAndCollateralTokenPair(
            loanToken.address,
            collateralToken1.address,
          );
          loanResult = await loanManager.getTokenAddressList(LOAN_TYPE);
          collateralResult = await loanManager.getTokenAddressList(
            COLLATERAL_TYPE,
          );
          expect(loanResult.tokenAddressList).to.have.members([
            loanToken.address,
          ]);
          expect(loanResult.isActive).to.have.members([true]);
          expect(collateralResult.tokenAddressList).to.have.members([
            collateralToken.address,
            collateralToken1.address,
          ]);
          expect(collateralResult.isActive).to.have.members([true, false]);
        });
      },
    );
  });

  describe('#getLoanInterestRate', () => {
    const initialSupply = toFixedBN(1000);
    const loanTerm = 30;
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);

      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
      );
    });

    it('succeeds', async () => {
      await loanManager.setPoolGroupSizeIfNeeded(loanToken.address, loanTerm);

      // TODO(ZhangRGK): expect to the model result
      await loanManager.getLoanInterestRate(loanToken.address, loanTerm);
    });
  });
});
