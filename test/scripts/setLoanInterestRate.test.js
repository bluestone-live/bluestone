const Configuration = artifacts.require('Configuration');
const setLoanInterestRate = require('../../scripts/javascript/setLoanInterestRate.js');
const deployTokens = require('../../scripts/javascript/deployTokens.js');
const { toFixedBN } = require('../utils/index.js');
const { expect } = require('chai');

describe('script: setLoanInterestRate', () => {
  let config;
  const cb = () => {};
  const network = 'development';
  const tokenSymbol = 'ETH';

  before(async () => {
    config = await Configuration.deployed();
    await deployTokens(cb, network);
  });

  contract('Configuration', () => {
    context('when input is valid', () => {
      it('succeeds', async () => {
        const loanTerm = 1;
        const value = 0.5;
        const asset = await setLoanInterestRate(
          cb,
          network,
          tokenSymbol,
          loanTerm,
          value,
        );

        expect(
          await config.getLoanInterestRate(asset, loanTerm),
        ).to.be.bignumber.equal(toFixedBN(value));
      });
    });
  });
});
