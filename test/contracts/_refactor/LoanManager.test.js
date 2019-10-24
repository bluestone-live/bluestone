const LoanManager = artifacts.require('_LoanManagerMock');
const PriceOracle = artifacts.require('_PriceOracle');
const { toFixedBN, createERC20Token } = require('../../utils/index.js');
const {
  BN,
  expectRevert,
  expectEvent,
  time,
} = require('openzeppelin-test-helpers');
const { expect } = require('chai');

contract('LoanManager', function([owner, depositor, loaner, liquidator]) {
  let loanManager, priceOracle;

  beforeEach(async () => {
    loanManager = await LoanManager.new();
    priceOracle = await PriceOracle.new();
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
      // TODO(ZhangRGK): after the liquidityPools implement
      it('succeed');
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
          remainingDebtList,
          createdAtList,
          isClosedList,
        } = await loanManager.getLoanRecordsByAccount(owner);
        expect(loanIdList.length).to.equal(0);
        expect(loanTokenAddressList.length).to.equal(0);
        expect(collateralTokenAddressList.length).to.equal(0);
        expect(loanTermList.length).to.equal(0);
        expect(remainingDebtList.length).to.equal(0);
        expect(createdAtList.length).to.equal(0);
        expect(isClosedList.length).to.equal(0);
      });
    });

    context('when user have loan records', () => {
      it('succeeds');
    });
  });

  describe('#addCollateral', () => {
    it('succeeds');
  });

  describe('#getFreedCollateralsByAccount', () => {
    it('succeeds');
  });

  describe('#withdrawFreedCollateral', () => {
    context('when amount is valid', () => {
      it('succeeds');
    });

    context('when amount is invalid', () => {
      it('reverts');
    });
  });

  describe('#addFreedCollateral', () => {
    it('succeeds');
  });

  describe('#subtractFreedCollateral', () => {
    it('succeeds');
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
      await priceOracle.setPrice(loanToken.address, toFixedBN(10));
      await priceOracle.setPrice(collateralToken.address, toFixedBN(10));
      await loanManager.setPriceOracleAddress(priceOracle.address);
      await loanManager.enableDepositToken(loanToken.address);
      await loanManager.enableDepositTerm(depositTerm);
      await loanManager.initPoolGroupIfNeeded(loanToken.address, depositTerm);
      await loanToken.approve(loanManager.address, initialSupply, {
        from: depositor,
      });

      await collateralToken.approve(loanManager.address, initialSupply, {
        from: loaner,
      });

      await loanManager.deposit(loanToken.address, depositAmount, depositTerm, {
        from: depositor,
      });
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
        const useFreedCollateral = false;

        const { logs } = await loanManager.loan(
          loanToken.address,
          collateralToken.address,
          loanAmount,
          collateralAmount,
          loanTerm,
          useFreedCollateral,
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
    let loanToken, collateralToken, loanId;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
      await priceOracle.setPrice(loanToken.address, toFixedBN(10));
      await priceOracle.setPrice(collateralToken.address, toFixedBN(10));
      await loanManager.setPriceOracleAddress(priceOracle.address);
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

      await loanManager.deposit(loanToken.address, depositAmount, depositTerm, {
        from: depositor,
      });

      const useFreedCollateral = false;

      const { logs } = await loanManager.loan(
        loanToken.address,
        collateralToken.address,
        loanAmount,
        collateralAmount,
        loanTerm,
        useFreedCollateral,
        {
          from: loaner,
        },
      );

      loanId = logs.filter(log => log.event === 'LoanSucceed')[0].args.loanId;
    });

    context('when loan and collateral token pair is enabled', () => {
      it('repays fully', async () => {
        const prevLoanRecord = await loanManager.getLoanRecordById(loanId);

        await loanToken.approve(
          loanManager.address,
          prevLoanRecord.remainingDebt,
          {
            from: loaner,
          },
        );

        const { logs } = await loanManager.repayLoan(
          loanId,
          prevLoanRecord.remainingDebt,
          { from: loaner },
        );

        expectEvent.inLogs(logs, 'RepayLoanSucceed', {
          accountAddress: loaner,
          loanId: loanId,
        });

        const currLoanRecord = await loanManager.getLoanRecordById(loanId);
        expect(currLoanRecord.remainingDebt).to.bignumber.equal(new BN(0));
        expect(currLoanRecord.isClosed).to.be.true;
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
    let loanToken, collateralToken, loanId;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
      await loanToken.mint(liquidator, initialSupply);
      await priceOracle.setPrice(loanToken.address, toFixedBN(10));
      await priceOracle.setPrice(collateralToken.address, toFixedBN(10));
      await loanManager.setPriceOracleAddress(priceOracle.address);
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

      await loanManager.deposit(loanToken.address, depositAmount, depositTerm, {
        from: depositor,
      });

      const useFreedCollateral = false;

      const { logs } = await loanManager.loan(
        loanToken.address,
        collateralToken.address,
        loanAmount,
        collateralAmount,
        loanTerm,
        useFreedCollateral,
        {
          from: loaner,
        },
      );

      loanId = logs.filter(log => log.event === 'LoanSucceed')[0].args.loanId;
    });

    context('when loan is defaulted', () => {
      beforeEach(async () => {
        await time.increase(time.duration.days(loanTerm + 1));
      });

      it('liquidates fully', async () => {
        const prevLoanRecord = await loanManager.getLoanRecordById(loanId);

        await loanToken.approve(
          loanManager.address,
          prevLoanRecord.remainingDebt,
          {
            from: liquidator,
          },
        );

        const { logs } = await loanManager.liquidateLoan(
          loanId,
          prevLoanRecord.remainingDebt,
          { from: liquidator },
        );

        expectEvent.inLogs(logs, 'LiquidateLoanSucceed', {
          accountAddress: liquidator,
          loanId: loanId,
        });

        const currLoanRecord = await loanManager.getLoanRecordById(loanId);
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

  describe('#setLoanInterestRatesForToken', () => {
    const initialSupply = toFixedBN(1000);
    let loanToken, collateralToken;

    beforeEach(async () => {
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);
    });

    context("when arrays' lengths do not match", () => {
      let tokenAddress, loanTerms, loanInterestRateList;

      beforeEach(async () => {
        tokenAddress = loanToken.address;
        loanTerms = [7, 30];
        loanInterestRateList = [toFixedBN(0.5)];
      });

      it('reverts', async () => {
        await expectRevert(
          loanManager.setLoanInterestRatesForToken(
            tokenAddress,
            loanTerms,
            loanInterestRateList,
          ),
          "LoanManager: Arrays' length must be the same.",
        );
      });
    });

    context('when interest rate is not smaller than 1', () => {
      let tokenAddress, loanTerms, loanInterestRateList0, loanInterestRateList1;

      beforeEach(async () => {
        tokenAddress = loanToken.address;
        loanTerms = [7, 30];
        loanInterestRateList0 = [toFixedBN(0.5), toFixedBN(1)];
        loanInterestRateList1 = [toFixedBN(1.1), toFixedBN(0.1)];
      });

      it('reverts', async () => {
        await expectRevert(
          loanManager.setLoanInterestRatesForToken(
            tokenAddress,
            loanTerms,
            loanInterestRateList0,
          ),
          'LoanManager: interest rate must be smaller than 1.',
        );
        await expectRevert(
          loanManager.setLoanInterestRatesForToken(
            tokenAddress,
            loanTerms,
            loanInterestRateList1,
          ),
          'LoanManager: interest rate must be smaller than 1.',
        );
      });
    });

    context('when loan interest rates are added', () => {
      let tokenAddress, loanTerms, loanInterestRateList;

      beforeEach(async () => {
        tokenAddress = loanToken.address;
        loanTerms = [7, 30];
        loanInterestRateList = [toFixedBN(0.5), toFixedBN(0.01)];
        await loanManager.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
        );
      });

      it('succeeds', async () => {
        await loanManager.setLoanInterestRatesForToken(
          tokenAddress,
          loanTerms,
          loanInterestRateList,
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

  describe('#getLoanInterestRateByToken', () => {
    it('succeeds');
  });

  describe('#_getLoanBasicInfoById', () => {
    it('succeeds');
  });

  describe('#_getLoanExtraInfoById', () => {
    it('succeeds');
  });

  describe('#_calculateRemainingDebt', () => {
    it('succeeds');
  });
});
