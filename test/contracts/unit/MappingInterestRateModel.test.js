const InterestRateModel = artifacts.require('MappingInterestRateModel');
const { toFixedBN, createERC20Token } = require('../../utils/index.js');
const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('MappingInterestRateModel', function ([owner]) {
  const maxLoanTerm = new BN(90);
  const loanTerms = [new BN(1), new BN(7), new BN(30), new BN(60), new BN(90)];
  const loanInterestRates = [
    toFixedBN(0.02),
    toFixedBN(0.05),
    toFixedBN(0.09),
    toFixedBN(0.12),
    toFixedBN(0.15),
  ];

  describe('#setRates', () => {
    let interestRateModel, token;
    beforeEach(async () => {
      interestRateModel = await InterestRateModel.new();
      token = await createERC20Token(owner);
    });

    it('get revert of array length inequality', async () => {
      await expectRevert(
        interestRateModel.setRates(
          token.address,
          loanTerms,
          [toFixedBN(0.01)].concat(loanInterestRates),
        ),
        'InterestRateModel: The length of Terms array must equal to InterestRates array',
      );
    });

    it('get revert of interestRate zero', async () => {
      await expectRevert(
        interestRateModel.setRates(
          token.address,
          [new BN(6)].concat(loanTerms),
          [toFixedBN(0)].concat(loanInterestRates),
        ),
        'InterestRateModel: Loan Interest Rate can not be zero',
      );
    });
  });

  let interestRateModel, token;

  beforeEach(async () => {
    interestRateModel = await InterestRateModel.new();
    token = await createERC20Token(owner);
    await interestRateModel.setRates(
      token.address,
      loanTerms,
      loanInterestRates,
    );
  });

  describe('#getLoanInterestRate', () => {
    it('get revert of disabled token', async () => {
      const newToken = await createERC20Token(owner);
      await expectRevert(
        interestRateModel.getLoanInterestRate(
          newToken.address,
          loanTerms[0],
          maxLoanTerm,
        ),
        'InterestRateModel: token is not enabled',
      );
    });

    it('get revert of disabled term', async () => {
      await expectRevert(
        interestRateModel.getLoanInterestRate(
          token.address,
          new BN(2),
          maxLoanTerm,
        ),
        'InterestRateModel: term is not enabled',
      );
    });

    it('succeed', async () => {
      for (index in loanTerms) {
        const actualLoanInterestRate =
          await interestRateModel.getLoanInterestRate(
            token.address,
            loanTerms[index],
            maxLoanTerm,
          );
        const expectedLoanInterestRate = loanInterestRates[index];
        expect(actualLoanInterestRate).to.bignumber.equal(
          expectedLoanInterestRate,
        );
      }
    });
  });

  describe('#getAllRates', () => {
    it('succeed', async () => {
      const { targetLoanTerms, targetLoanInterestRates } =
        await interestRateModel.getAllRates(token.address);

      for (let i in targetLoanTerms) {
        expect(targetLoanTerms[i]).to.bignumber.equal(loanTerms[i]);
        expect(targetLoanInterestRates[i]).to.bignumber.equal(
          loanInterestRates[i],
        );
      }
    });
  });
});
