const DepositManager = artifacts.require('./DepositManager.sol');
const disableDepositTerm = require('../../scripts/javascript/disableDepositTerm.js');
const { expect } = require('chai');

describe('script: disableDepositTerm', () => {
  let depositManager;
  const cb = () => {};
  const network = 'development';
  const term = 30;

  before(async () => {
    depositManager = await DepositManager.deployed();
  });

  contract('DepositManager', () => {
    before(async () => {
      await depositManager.enableDepositTerm(term);
    });

    context('when the term is enabled', () => {
      it('succeeds', async () => {
        const prevTerms = await depositManager.getDepositTerms();
        await disableDepositTerm(cb, network, term);
        const currTerms = await depositManager.getDepositTerms();
        expect(currTerms.length).to.equal(prevTerms.length - 1);
        expect(currTerms.map(term => term.toNumber())).to.not.contain(term);
      });
    });

    context('when the term is disabled', () => {
      it('does nothing', async () => {
        const prevTerms = await depositManager.getDepositTerms();
        await disableDepositTerm(cb, network, term);
        const currTerms = await depositManager.getDepositTerms();
        expect(currTerms.length).to.equal(prevTerms.length);
      });
    });
  });
});
