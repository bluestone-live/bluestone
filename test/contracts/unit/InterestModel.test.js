const InterestModel = artifacts.require('InterestModel');
const { toFixedBN, createERC20Token } = require('../../utils/index.js');
const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('InterestModel', function([owner]) {
  let interestModel, token;

  beforeEach(async () => {
    interestModel = await InterestModel.new();
    token = await createERC20Token(owner);
  });

  describe('#getLoanInterestRate', () => {
    it('succeeds', async () => {
      const lowerBound = toFixedBN(0.1);
      const upperBound = toFixedBN(0.15);

      await interestModel.setLoanParameters(
        token.address,
        lowerBound,
        upperBound,
      );

      const loanTerm = new BN(30);
      const maxLoanTerm = new BN(90);

      const actualLoanInterestRate = await interestModel.getLoanInterestRate(
        token.address,
        loanTerm,
        maxLoanTerm,
      );

      const expectedLoanInterestRate = upperBound.sub(
        upperBound
          .sub(lowerBound)
          .mul(loanTerm)
          .div(maxLoanTerm),
      );

      expect(actualLoanInterestRate).to.bignumber.equal(
        expectedLoanInterestRate,
      );
    });
  });

  describe('#getLoanParameters', () => {
    it('succeed', async () => {
      const lowerBound = toFixedBN(0.1);
      const upperBound = toFixedBN(0.15);

      await interestModel.setLoanParameters(
        token.address,
        lowerBound,
        upperBound,
      );

      const {
        loanInterestRateLowerBound,
        loanInterestRateUpperBound,
      } = await interestModel.getLoanParameters(token.address);

      expect(loanInterestRateLowerBound).to.bignumber.equal(lowerBound);
      expect(loanInterestRateUpperBound).to.bignumber.equal(upperBound);
    });
  });
});
