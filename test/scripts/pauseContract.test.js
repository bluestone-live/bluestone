const pauseContract = require('../../scripts/javascript/pauseContract.js');
const { expect } = require('chai');

const cb = () => {};
const network = 'development';

describe('script: pauseContract', () => {
  contract('DepositManager', () => {
    context('when the deposit manager is unpaused', () => {
      it('succeeds', async () => {
        const succeed = await pauseContract(cb, network, 'DepositManager');
        expect(succeed).to.be.true;
      });
    });

    context('when the deposit manager is paused', () => {
      it('fails', async () => {
        const succeed = await pauseContract(cb, network, 'DepositManager');
        expect(succeed).to.be.false;
      });
    });
  });
});

describe('script: pauseContract', () => {
  contract('LoanManager', () => {
    context('when the loan manager is unpaused', () => {
      it('succeeds', async () => {
        const succeed = await pauseContract(cb, network, 'LoanManager');
        expect(succeed).to.be.true;
      });
    });

    context('when the loan manager is paused', () => {
      it('fails', async () => {
        const succeed = await pauseContract(cb, network, 'LoanManager');
        expect(succeed).to.be.false;
      });
    });
  });
});
