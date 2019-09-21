const Protocol = artifacts.require('Protocol');
const { expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');

<<<<<<< HEAD
<<<<<<< HEAD
contract('Protocol', function([owner, otherAccount]) {
=======
contract("Protocol", function([owner, otherAccount]) {
>>>>>>> [Contract]: implement getLoanRecordsByAccount
=======
contract("Protocol", function([owner]) {
>>>>>>> [Contract]: implement getFreedCollateral and withdrawFreedCollateral
  let protocol;

  beforeEach(async () => {
    protocol = await Protocol.new();
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

  describe('#getLoanBasicInfoById', () => {
    context('when loan id is valid', () => {
      // TODO(ZhangRGK): after the liquidityPools implement
      it('succeed');
    });

    context('when loan id is invalid', () => {
      it('revert', async () => {
        await expectRevert(
          protocol.getLoanBasicInfoById(web3.utils.hexToBytes('0x00000000')),
          'LoanManager: Loan ID is invalid',
        );
      });
    });
  });

  describe('#getLoanExtraInfoById', () => {
    context('when loan id is valid', () => {
      // TODO(ZhangRGK): after the liquidityPools implement
      it('succeed');
    });

    context('when loan id is invalid', () => {
      it('revert', async () => {
        await expectRevert(
          protocol.getLoanExtraInfoById(web3.utils.hexToBytes('0x00000000')),
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
        } = await protocol.getLoanRecordsByAccount(otherAccount);
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
  describe("#addCollateral", () => {
    it("succeed");
  });
  describe("#getFreedCollateralsByAccount", () => {
    context("in initialization", () => {
      // TODO(ZhangRGK): depends on set collateral token function
      it("should get 0 for each token");
    });
  });

  describe("#withdrawFreedCollateral", () => {
    context("when amount is enough to withdraw", () => {
      // TODO(ZhangRGK): depends on set collateral token function
      it("succeed");
    });

    context("when amount is not enough", () => {
      // TODO(ZhangRGK): depends on set collateral token function
      it("reverts");
    });
  });
});
