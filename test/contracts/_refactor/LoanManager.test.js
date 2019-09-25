const Protocol = artifacts.require('Protocol');
const PriceOracle = artifacts.require('_PriceOracle');
const { toFixedBN, createERC20Token } = require('../../utils/index.js');
const { expectRevert, expectEvent } = require('openzeppelin-test-helpers');
const { expect } = require('chai');

contract('Protocol', function([owner, depositor, loaner]) {
  const initialSupply = toFixedBN(1000);
  let protocol, loanToken, collateralToken, priceOracle;

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
        // TODO(desmond): enable loan and collateral token pair
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
});
