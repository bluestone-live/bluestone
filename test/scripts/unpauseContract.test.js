const unpauseContract = require('../../scripts/javascript/unpauseContract.js');
const pauseContract = require('../../scripts/javascript/pauseContract.js');
const { expect } = require('chai');

describe('script: unpauseContract', () => {
  const cb = () => {};
  const network = 'development';

  contract('DepositManager', () => {
    context('when the deposit manager is unpaused', () => {
      it('fails', async () => {
        const succeed = await unpauseContract(cb, network, 'DepositManager');
        expect(succeed).to.be.false;
      });
    });

    context('when the deposit manager is paused', () => {
      before(async () => {
        await pauseContract(cb, network, 'DepositManager');
      });

      it('succeeds', async () => {
        const succeed = await unpauseContract(cb, network, 'DepositManager');
        expect(succeed).to.be.true;
      });
    });
  });

  contract('LoanManager', () => {
    context('when the loan manager is unpaused', () => {
      it('fails', async () => {
        const succeed = await unpauseContract(cb, network, 'LoanManager');
        expect(succeed).to.be.false;
      });
    });

    context('when the loan manager is paused', () => {
      before(async () => {
        await pauseContract(cb, network, 'LoanManager');
      });

      it('succeeds', async () => {
        const succeed = await unpauseContract(cb, network, 'LoanManager');
        expect(succeed).to.be.true;
      });
    });
  });
});
