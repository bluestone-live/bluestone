const LoanManager = artifacts.require('LoanManagerMock');
const InterestModel = artifacts.require('InterestModel');
const PriceOracle = artifacts.require('PriceOracle');
const { toFixedBN, createERC20Token } = require('../../utils/index.js');
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
  let loanManager, priceOracle, interestModel;
  const depositDistributorFeeRatio = toFixedBN(0.01);
  const loanDistributorFeeRatio = toFixedBN(0.02);

  beforeEach(async () => {
    loanManager = await LoanManager.new();
    priceOracle = await PriceOracle.new();
    interestModel = await InterestModel.new();

    await loanManager.setInterestModel(interestModel.address);
    await loanManager.setMaxDistributorFeeRatios(
      depositDistributorFeeRatio,
      loanDistributorFeeRatio,
    );
  });

  describe('#setMaxLoanTerm', () => {
    const initialSupply = toFixedBN(1000);
    const maxLoanTerm = new BN(365);
    let loanToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
    });

    context('when pool group is not initialized', () => {
      it('reverts', async () => {
        expectRevert(
          loanManager.setMaxLoanTerm(loanToken.address, maxLoanTerm),
          'LiquidityPools: pool group is not initialized',
        );
      });
    });

    context('when pool group is initialized', () => {
      const numPools = new BN(30);

      beforeEach(async () => {
        await loanManager.initPoolGroupIfNeeded(loanToken.address, numPools);
      });

      it('succeeds', async () => {
        expect(
          await loanManager.getMaxLoanTerm(loanToken.address),
        ).to.bignumber.equal(numPools);

        await loanManager.setMaxLoanTerm(loanToken.address, maxLoanTerm);

        expect(
          await loanManager.getMaxLoanTerm(loanToken.address),
        ).to.bignumber.equal(maxLoanTerm);
      });
    });
  });

  describe('#getLoanRecordById', () => {
    context('when loan id is valid', () => {
      const initialSupply = toFixedBN(1000);
      const depositAmount = toFixedBN(10);
      const depositTerm = 30;
      const loanAmount = toFixedBN(10);
      const collateralAmount = toFixedBN(30);
      const loanTerm = 30;
      const useAvailableCollateral = false;
      const maxLoanTerm = new BN(365);
      const numPools = new BN(60);

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
        await loanManager.initPoolGroupIfNeeded(loanToken.address, depositTerm);
        await loanToken.approve(loanManager.address, initialSupply, {
          from: depositor,
        });
        await loanManager.initPoolGroupIfNeeded(loanToken.address, numPools);
        await loanManager.setMaxLoanTerm(loanToken.address, maxLoanTerm);

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
          useAvailableCollateral,
          distributorAddress,
          {
            from: loaner,
          },
        );

        recordId = logs.filter(log => log.event === 'LoanSucceed')[0].args
          .recordId;
      });

      it('succeed', async () => {
        const interestRate = await loanManager.getLoanInterestRate(
          loanToken.address,
          maxLoanTerm,
        );
        const interest = loanAmount.mul(interestRate);
        const record = await loanManager.getLoanRecordById(recordId);

        expect(record.loanTokenAddress).to.equal(loanToken.address);
        expect(record.collateralTokenAddress).to.equal(collateralToken.address);
        expect(record.loanTerm.toString()).to.equal(loanTerm.toString());
        expect(record.loanAmount).to.bignumber.equal(loanAmount);
        expect(record.collateralAmount).to.bignumber.equal(collateralAmount);
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
        const {
          loanIdList,
          loanTokenAddressList,
          collateralTokenAddressList,
          loanTermList,
          loanAmountList,
          collateralAmountList,
          createdAtList,
        } = await loanManager.getLoanRecordsByAccount(owner);
        expect(loanIdList.length).to.equal(0);
        expect(loanTokenAddressList.length).to.equal(0);
        expect(collateralTokenAddressList.length).to.equal(0);
        expect(loanTermList.length).to.equal(0);
        expect(loanAmountList.length).to.equal(0);
        expect(collateralAmountList.length).to.equal(0);
        expect(createdAtList.length).to.equal(0);
      });
    });

    context('when user have loan records', () => {
      const initialSupply = toFixedBN(1000);
      const depositAmount = toFixedBN(10);
      const depositTerm = 30;
      const loanAmount = toFixedBN(10);
      const collateralAmount = toFixedBN(30);
      const loanTerm = 30;
      const useAvailableCollateral = false;

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
        await loanManager.initPoolGroupIfNeeded(loanToken.address, depositTerm);
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
          useAvailableCollateral,
          distributorAddress,
          {
            from: loaner,
          },
        );

        recordId = logs.filter(log => log.event === 'LoanSucceed')[0].args
          .recordId;
      });

      it('succeeds', async () => {
        const {
          loanIdList,
          loanTokenAddressList,
          collateralTokenAddressList,
          loanTermList,
          loanAmountList,
          collateralAmountList,
          createdAtList,
        } = await loanManager.getLoanRecordsByAccount(loaner);

        expect(loanIdList.length).to.equal(1);
        expect(loanTokenAddressList.length).to.equal(1);
        expect(collateralTokenAddressList.length).to.equal(1);
        expect(loanTermList.length).to.equal(1);
        expect(loanAmountList.length).to.equal(1);
        expect(collateralAmountList.length).to.equal(1);
        expect(createdAtList.length).to.equal(1);
        expect(loanIdList[0]).to.equal(recordId);
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
    const useAvailableCollateral = false;

    let loanToken, collateralToken, recordId;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
      await priceOracle.setPrice(toFixedBN(10));
      await loanManager.setPriceOracle(loanToken.address, priceOracle.address);
      await loanManager.setPriceOracle(
        collateralToken.address,
        priceOracle.address,
      );
      await loanManager.enableDepositToken(loanToken.address);
      await loanManager.enableDepositTerm(depositTerm);
      await loanManager.initPoolGroupIfNeeded(loanToken.address, depositTerm);
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
        useAvailableCollateral,
        distributorAddress,
        {
          from: loaner,
        },
      );

      recordId = logs.filter(log => log.event === 'LoanSucceed')[0].args
        .recordId;
    });

    it('succeeds', async () => {
      const useAvailableCollateralInAddCollateral = false;
      const collateralAmount = toFixedBN(10);
      const { logs } = await loanManager.addCollateral(
        recordId,
        collateralAmount,
        useAvailableCollateralInAddCollateral,
        {
          from: loaner,
        },
      );

      expectEvent.inLogs(logs, 'AddCollateralSucceed', {
        accountAddress: loaner,
        recordId: recordId,
        amount: collateralAmount,
      });
    });
  });

  describe('#getAvailableCollateralsByAccount', () => {
    const initialSupply = toFixedBN(1000);
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);

      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
      );
    });

    context("when user didn't have available collateral amount", () => {
      it('get zero', async () => {
        const {
          tokenAddressList,
          availableCollateralAmountList,
        } = await loanManager.getAvailableCollateralsByAccount(loaner);

        expect(tokenAddressList[0]).to.equal(collateralToken.address);
        expect(availableCollateralAmountList[0]).to.bignumber.equal(
          toFixedBN(0),
        );
      });
    });

    context('when user have available collateral amount', () => {
      const estimateAvailableCollateralToken = toFixedBN(5);

      beforeEach(async () => {
        await loanManager.addAvailableCollateral(
          loaner,
          collateralToken.address,
          estimateAvailableCollateralToken,
        );
      });

      it('get correctly amount', async () => {
        const {
          tokenAddressList,
          availableCollateralAmountList,
        } = await loanManager.getAvailableCollateralsByAccount(loaner);

        expect(tokenAddressList[0]).to.equal(collateralToken.address);
        expect(availableCollateralAmountList[0]).to.bignumber.equal(
          estimateAvailableCollateralToken,
        );
      });
    });
  });

  describe('#withdrawAvailableCollateral', () => {
    const initialSupply = toFixedBN(1000);
    const availableCollateralAmount = toFixedBN(100);
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
      // Make sure there are enough token in protocol
      await collateralToken.mint(loanManager.address, initialSupply);

      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
      );
      await loanManager.addAvailableCollateral(
        loaner,
        collateralToken.address,
        availableCollateralAmount,
      );
    });

    context('when amount is valid', () => {
      it('succeeds', async () => {
        const { logs } = await loanManager.withdrawAvailableCollateral(
          collateralToken.address,
          availableCollateralAmount,
          {
            from: loaner,
          },
        );

        expectEvent.inLogs(logs, 'WithdrawAvailableCollateralSucceed', {
          accountAddress: loaner,
          amount: toFixedBN(0),
        });
      });
    });

    context('when amount is invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          loanManager.withdrawAvailableCollateral(
            collateralToken.address,
            availableCollateralAmount.add(toFixedBN(1)),
            {
              from: loaner,
            },
          ),
          'LoanManager: available collateral amount is not enough',
        );
      });
    });
  });

  describe('#addAvailableCollateral', () => {
    const initialSupply = toFixedBN(1000);
    const availableCollateralAmount = toFixedBN(100);
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
      await loanManager.addAvailableCollateral(
        loaner,
        collateralToken.address,
        availableCollateralAmount,
      );
    });
  });

  describe('#subtractAvailableCollateral', () => {
    const initialSupply = toFixedBN(1000);
    const availableCollateralAmount = toFixedBN(100);
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);

      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
      );
      await loanManager.addAvailableCollateral(
        loaner,
        collateralToken.address,
        availableCollateralAmount,
      );
    });
    it('succeeds', async () => {
      await loanManager.subtractAvailableCollateral(
        loaner,
        collateralToken.address,
        availableCollateralAmount,
      );
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
      await loanManager.enableDepositToken(loanToken.address);
      await loanManager.enableDepositTerm(depositTerm);
      await loanManager.initPoolGroupIfNeeded(loanToken.address, depositTerm);
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
        const useAvailableCollateral = false;

        const { logs } = await loanManager.loan(
          loanToken.address,
          collateralToken.address,
          loanAmount,
          collateralAmount,
          loanTerm,
          useAvailableCollateral,
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
  });

  describe('#repayLoan', () => {
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
      await loanManager.setPriceOracle(loanToken.address, priceOracle.address);
      await loanManager.setPriceOracle(
        collateralToken.address,
        priceOracle.address,
      );
      await loanManager.enableDepositToken(loanToken.address);
      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
        { from: owner },
      );
      await loanManager.enableDepositTerm(depositTerm);
      await loanManager.initPoolGroupIfNeeded(loanToken.address, depositTerm);

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

      const useAvailableCollateral = false;

      const { logs } = await loanManager.loan(
        loanToken.address,
        collateralToken.address,
        loanAmount,
        collateralAmount,
        loanTerm,
        useAvailableCollateral,
        distributorAddress,
        {
          from: loaner,
        },
      );

      recordId = logs.filter(log => log.event === 'LoanSucceed')[0].args
        .recordId;
    });

    // How about if a loan pair disabled?
    context('when loan and collateral token pair is enabled', () => {
      it('repays fully', async () => {
        const prevLoanRecord = await loanManager.getLoanRecordDetailsById(
          recordId,
        );
        const prevDistributorBalance = await loanToken.balanceOf(
          distributorAddress,
        );

        await loanToken.approve(
          loanManager.address,
          prevLoanRecord.remainingDebt,
          {
            from: loaner,
          },
        );

        const { logs } = await loanManager.repayLoan(
          recordId,
          prevLoanRecord.remainingDebt,
          { from: loaner },
        );

        expectEvent.inLogs(logs, 'RepayLoanSucceed', {
          accountAddress: loaner,
          recordId: recordId,
        });

        const currLoanRecord = await loanManager.getLoanRecordDetailsById(
          recordId,
        );
        expect(currLoanRecord.remainingDebt).to.bignumber.equal(new BN(0));
        expect(currLoanRecord.isClosed).to.be.true;
        expect(
          await loanToken.balanceOf(distributorAddress),
        ).to.bignumber.equal(
          prevDistributorBalance.add(
            prevLoanRecord.remainingDebt
              .sub(loanAmount)
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
    let loanToken, collateralToken, recordId;

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
      await loanManager.enableDepositToken(loanToken.address);
      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
        { from: owner },
      );
      await loanManager.enableDepositTerm(depositTerm);
      await loanManager.initPoolGroupIfNeeded(loanToken.address, depositTerm);

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

      const useAvailableCollateral = false;

      const { logs } = await loanManager.loan(
        loanToken.address,
        collateralToken.address,
        loanAmount,
        collateralAmount,
        loanTerm,
        useAvailableCollateral,
        distributorAddress,
        {
          from: loaner,
        },
      );

      recordId = logs.filter(log => log.event === 'LoanSucceed')[0].args
        .recordId;
    });

    context('when loan is defaulted', () => {
      beforeEach(async () => {
        await time.increase(time.duration.days(loanTerm + 1));
      });

      it('liquidates fully', async () => {
        const prevLoanRecord = await loanManager.getLoanRecordDetailsById(
          recordId,
        );

        await loanToken.approve(
          loanManager.address,
          prevLoanRecord.remainingDebt,
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

        const currLoanRecord = await loanManager.getLoanRecordDetailsById(
          recordId,
        );
        expect(currLoanRecord.remainingDebt).to.bignumber.equal(new BN(0));
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

    context('when minimum collateral coverage ratios are added', () => {
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
        expect(result.loanTokenAddressList.length).to.be.equal(0);
        expect(result.collateralTokenAddressList.length).to.be.equal(0);
        expect(result.isEnabledList.length).to.be.equal(0);
        expect(result.minCollateralCoverageRatioList.length).to.be.equal(0);
        expect(result.liquidationDiscountList.length).to.be.equal(0);
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

        let result = await loanManager.getLoanAndCollateralTokenPairs();
        expect(result.loanTokenAddressList).to.have.members([loanTokenAddress]);
        expect(result.collateralTokenAddressList).to.have.members(
          collateralTokenAddressList,
        );
        expect(result.isEnabledList).to.have.members([true, true]);
        for (let i = 0; i < collateralTokenAddressList.length; i++) {
          expect(
            result.minCollateralCoverageRatioList[i],
          ).to.be.bignumber.equal(minCollateralCoverageRatioList[i]);
          expect(result.liquidationDiscountList[i]).to.be.bignumber.equal(
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
    const maxLoanTerm = new BN(365);
    const numPools = new BN(60);
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);

      await loanManager.enableLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
      );

      await loanManager.initPoolGroupIfNeeded(loanToken.address, numPools);
      await loanManager.setMaxLoanTerm(loanToken.address, maxLoanTerm);
    });

    it('succeeds', async () => {
      // TODO(ZhangRGK): expect to the model result
      await loanManager.getLoanInterestRate(loanToken.address, maxLoanTerm);
    });
  });
});
