const InterestRateModel = artifacts.require('MappingInterestRateModel');
const { toFixedBN, createERC20Token } = require('../../utils/index.js');
const { BN, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('MappingInterestRateModel', function ([owner]) {
  let interestRateModel, token;
  const maxLoanTerm = new BN(90);
  const loanTerms = [new BN(1), new BN(7), new BN(30), new BN(60), new BN(90)];
  const loanInterestRates = [
    toFixedBN(0.02),
    toFixedBN(0.05),
    toFixedBN(0.09),
    toFixedBN(0.12),
    toFixedBN(0.15),
  ];

  beforeEach(async () => {
    interestRateModel = await InterestRateModel.new();
    token = await createERC20Token(owner);
    await interestRateModel.setLoanParameters(
      token.address,
      loanTerms,
      loanInterestRates,
    );
  });

  describe('#getLoanInterestRate', () => {
    it('get revert succeed', async () => {
      await expectRevert(
        interestRateModel.getLoanInterestRate(
          token.address,
          new BN(91),
          maxLoanTerm,
        ),
        'InterestRateModel: Loan term exceeds max value',
      );
      await expectRevert(
        interestRateModel.getLoanInterestRate(
          token.address,
          new BN(2),
          maxLoanTerm,
        ),
        "InterestRateModel: Loan interest rate haven't setted",
      );
    });

    it('succeeds', async () => {
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

  describe('#getLoanParameters', () => {
    it('succeed', async () => {
      const { targetLoanTerms, targetLoanInterestRates } =
        await interestRateModel.getLoanParameters(token.address);

      for (let i in targetLoanTerms) {
        expect(targetLoanTerms[i]).to.bignumber.equal(loanTerms[i]);
        expect(targetLoanInterestRates[i]).to.bignumber.equal(
          loanInterestRates[i],
        );
      }
    });
  });
});
