const Protocol = artifacts.require('Protocol');
const PriceOracle = artifacts.require('_PriceOracle');
const { BN, expectRevert, expectEvent } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const { createERC20Token, toFixedBN } = require('../../utils/index.js');

contract('Protocol', function([owner, depositor, loaner]) {
  const initialSupply = toFixedBN(1000);
  let protocol, priceOracle, loanToken, collateralToken;

  beforeEach(async () => {
    protocol = await Protocol.new();
    priceOracle = await PriceOracle.new();
    loanToken = await createERC20Token(depositor, initialSupply);
    collateralToken = await createERC20Token(loaner, initialSupply);
  });

  describe('#addLoanTerm', () => {
    const term = 60;

    context('when term does not exist', () => {
      it('succeeds', async () => {
        await protocol.addLoanTerm(term);
        const currTerms = await protocol.getLoanTerms();
        expect(currTerms.length).to.equal(1);
        expect(currTerms.map(term => term.toNumber())).to.contain(term);
      });
    });

    context('when term already exists', () => {
      beforeEach(async () => {
        await protocol.addLoanTerm(term);
      });

      it('reverts', async () => {
        await expectRevert(
          protocol.addLoanTerm(term),
          'LoanManager: term already exists',
        );
      });
    });
  });

  describe('#removeLoanTerm', () => {
    const term = 60;

    context('when term already exists', () => {
      beforeEach(async () => {
        await protocol.addLoanTerm(term);
      });

      it('succeeds', async () => {
        await protocol.removeLoanTerm(term);
        const currTerms = await protocol.getLoanTerms();
        expect(currTerms.length).to.equal(0);
        expect(currTerms.map(term => term.toNumber())).to.not.contain(term);
      });
    });

    context('when term does not exist', () => {
      it('reverts', async () => {
        await expectRevert(
          protocol.removeLoanTerm(term),
          'LoanManager: term does not exist',
        );
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
          protocol.getLoanRecordById(web3.utils.hexToBytes('0x00000000')),
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
        } = await protocol.getLoanRecordsByAccount(owner);
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
      // TODO(ZhangRGK): depends on the loan and pool group implements
      it('succeed');
    });
  });

  // TODO(ZhangRGK): after the loan implement
  describe('#addCollateral', () => {
    it('succeed');
  });
  describe('#getFreedCollateralsByAccount', () => {
    context('in initialization', () => {
      // TODO(ZhangRGK): depends on set collateral token function
      it('should get 0 for each token');
    });
  });

  describe('#withdrawFreedCollateral', () => {
    context('when amount is enough to withdraw', () => {
      // TODO(ZhangRGK): depends on set collateral token function
      it('succeed');
    });

    context('when amount is not enough', () => {
      // TODO(ZhangRGK): depends on set collateral token function
      it('reverts');
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
      await protocol.setPriceOracleAddress(priceOracle.address);
      await protocol.enableDepositToken(loanToken.address);
      await protocol.enableDepositTerm(depositTerm);
      await protocol.addLoanTerm(7);
      await protocol.addLoanTerm(30);

      await loanToken.approve(protocol.address, initialSupply, {
        from: depositor,
      });

      await collateralToken.approve(protocol.address, initialSupply, {
        from: loaner,
      });

      await protocol.deposit(loanToken.address, depositAmount, depositTerm, {
        from: depositor,
      });
    });

    context('when loan and collateral token pair is enabled', () => {
      beforeEach(async () => {
        await protocol.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
        );
      });

      it('succeeds', async () => {
        const loanAmount = toFixedBN(10);
        const collateralAmount = toFixedBN(30);
        const loanTerm = 30;
        const useFreedCollateral = false;

        const { logs } = await protocol.loan(
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
          protocol.enableLoanAndCollateralTokenPair(
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
        await protocol.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
      });
    });

    context('when the pair already exists', () => {
      it('reverts', async () => {
        await protocol.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
        await expectRevert(
          protocol.enableLoanAndCollateralTokenPair(
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
          protocol.disableLoanAndCollateralTokenPair(
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
        await protocol.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
        await protocol.disableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
      });
    });

    context('when the pair is already disabled', () => {
      it('reverts', async () => {
        await protocol.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
        await protocol.disableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
          { from: owner },
        );
        await expectRevert(
          protocol.disableLoanAndCollateralTokenPair(
            loanToken.address,
            collateralToken.address,
            { from: owner },
          ),
          'LoanManager: loan token pair is already disabled.',
        );
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
      await protocol.setPriceOracleAddress(priceOracle.address);
      await protocol.enableDepositToken(loanToken.address);
      await protocol.enableLoanAndCollateralTokenPair(
        loanToken.address,
        collateralToken.address,
        { from: owner },
      );
      await protocol.enableDepositTerm(depositTerm);
      await protocol.addLoanTerm(7);
      await protocol.addLoanTerm(30);

      await loanToken.approve(protocol.address, initialSupply, {
        from: depositor,
      });

      await collateralToken.approve(protocol.address, initialSupply, {
        from: loaner,
      });

      await protocol.deposit(loanToken.address, depositAmount, depositTerm, {
        from: depositor,
      });

      const useFreedCollateral = false;

      const { logs } = await protocol.loan(
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
        const prevLoanRecord = await protocol.getLoanRecordById(loanId);

        await loanToken.approve(
          protocol.address,
          prevLoanRecord.remainingDebt,
          {
            from: loaner,
          },
        );

        const { logs } = await protocol.repayLoan(
          loanId,
          prevLoanRecord.remainingDebt,
          { from: loaner },
        );

        expectEvent.inLogs(logs, 'RepayLoanSucceed', {
          accountAddress: loaner,
          loanId: loanId,
        });

        const currLoanRecord = await protocol.getLoanRecordById(loanId);
        expect(currLoanRecord.remainingDebt).to.bignumber.equal(new BN(0));
        expect(currLoanRecord.isClosed).to.be.true;
      });
    });
  });

  describe('#setMinCollateralCoverageRatios', () => {
    context("when arrays' lengths are different", () => {
      let loanTokenAddressList,
        collateralTokenAddressList,
        minCollateralCoverageRatioList;

      beforeEach(async () => {
        loanTokenAddressList = [loanToken.address];
        collateralTokenAddressList = [collateralToken.address];
        minCollateralCoverageRatioList = [toFixedBN(1.5), toFixedBN(1.1)];
      });

      it('reverts', async () => {
        await expectRevert(
          protocol.setMinCollateralCoverageRatios(
            loanTokenAddressList,
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
          protocol.setMinCollateralCoverageRatios(
            loanTokenAddressList,
            collateralTokenAddressList,
            minCollateralCoverageRatioList,
          ),
          "LoanManager: Arrays' length must be the same.",
        );
      });
    });
    context('when some pairs are not enabled', () => {
      let loanTokenAddressList,
        collateralTokenAddressList,
        minCollateralCoverageRatioList;

      beforeEach(async () => {
        loanTokenAddressList = [loanToken.address];
        collateralTokenAddressList = [loanToken.address];
        minCollateralCoverageRatioList = [toFixedBN(1.5)];
      });

      it('reverts', async () => {
        await expectRevert(
          protocol.setMinCollateralCoverageRatios(
            loanTokenAddressList,
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
        let loanTokenAddressList,
          collateralTokenAddressList,
          minCollateralCoverageRatioList;

        beforeEach(async () => {
          loanTokenAddressList = [loanToken.address];
          collateralTokenAddressList = [collateralToken.address];
          minCollateralCoverageRatioList = [toFixedBN(1)];
          await protocol.enableLoanAndCollateralTokenPair(
            loanTokenAddressList[0],
            collateralTokenAddressList[0],
          );
        });

        it('reverts', async () => {
          await expectRevert(
            protocol.setMinCollateralCoverageRatios(
              loanTokenAddressList,
              collateralTokenAddressList,
              minCollateralCoverageRatioList,
            ),
            'LoanManager: Minimum CCR must be larger than lower bound.',
          );
        });
      },
    );

    context('when minimum collateral coverage ratios are added', () => {
      let loanTokenAddressList,
        collateralTokenAddressList,
        minCollateralCoverageRatioList;

      beforeEach(async () => {
        loanTokenAddressList = [loanToken.address];
        collateralTokenAddressList = [collateralToken.address];
        minCollateralCoverageRatioList = [toFixedBN(1.5)];
        await protocol.enableLoanAndCollateralTokenPair(
          loanTokenAddressList[0],
          collateralTokenAddressList[0],
        );
      });

      it('succeeds', async () => {
        await protocol.setMinCollateralCoverageRatios(
          loanTokenAddressList,
          collateralTokenAddressList,
          minCollateralCoverageRatioList,
        );
        // TODO(lambda): test it after finish getLoanAndCollateralTokenPairs method.
      });
    });
  });

  describe('#setLoanInterestRatesForToken', () => {
    context("when arrays' lengths do not match", () => {
      let tokenAddress, loanTerms, loanInterestRateList;

      beforeEach(async () => {
        tokenAddress = loanToken.address;
        loanTerms = [7, 30];
        loanInterestRateList = [toFixedBN(0.5)];
      });

      it('reverts', async () => {
        await expectRevert(
          protocol.setLoanInterestRatesForToken(
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
          protocol.setLoanInterestRatesForToken(
            tokenAddress,
            loanTerms,
            loanInterestRateList0,
          ),
          'LoanManager: interest rate must be smaller than 1.',
        );
        await expectRevert(
          protocol.setLoanInterestRatesForToken(
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
        await protocol.enableLoanAndCollateralTokenPair(
          loanToken.address,
          collateralToken.address,
        );
      });

      it('succeeds', async () => {
        await protocol.setLoanInterestRatesForToken(
          tokenAddress,
          loanTerms,
          loanInterestRateList,
        );
        // TODO(lambda): test it after finish getLoanAndCollateralTokenPairs method.
      });
    });
  });

  describe('#setLiquidationDiscounts', () => {
    context("when arrays' lengths are different", () => {
      let loanTokenAddressList,
        collateralTokenAddressList,
        liquidationDiscountList;

      beforeEach(async () => {
        loanTokenAddressList = [loanToken.address];
        collateralTokenAddressList = [collateralToken.address];
        liquidationDiscountList = [toFixedBN(0.95), toFixedBN(0.9)];
      });

      it('reverts', async () => {
        await expectRevert(
          protocol.setLiquidationDiscounts(
            loanTokenAddressList,
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
          protocol.setLiquidationDiscounts(
            loanTokenAddressList,
            collateralTokenAddressList,
            liquidationDiscountList,
          ),
          "LoanManager: Arrays' length must be the same.",
        );
      });
    });

    context('when some pairs are not enabled', () => {
      let loanTokenAddressList,
        collateralTokenAddressList,
        liquidationDiscountList;

      beforeEach(async () => {
        loanTokenAddressList = [loanToken.address];
        collateralTokenAddressList = [loanToken.address];
        liquidationDiscountList = [toFixedBN(0.9)];
      });

      it('reverts', async () => {
        await expectRevert(
          protocol.setLiquidationDiscounts(
            loanTokenAddressList,
            collateralTokenAddressList,
            liquidationDiscountList,
          ),
          'LoanManager: The token pair must be enabled.',
        );
      });
    });

    context('when minimum collateral coverage ratios are added', () => {
      let loanTokenAddressList,
        collateralTokenAddressList,
        liquidationDiscountList;

      beforeEach(async () => {
        loanTokenAddressList = [loanToken.address];
        collateralTokenAddressList = [collateralToken.address];
        liquidationDiscountList = [toFixedBN(0.03)];
        await protocol.enableLoanAndCollateralTokenPair(
          loanTokenAddressList[0],
          collateralTokenAddressList[0],
        );
      });

      it('succeeds', async () => {
        await protocol.setLiquidationDiscounts(
          loanTokenAddressList,
          collateralTokenAddressList,
          liquidationDiscountList,
        );
        // TODO(lambda): test it after finish getLoanAndCollateralTokenPairs method.
      });
    });
  });
});
