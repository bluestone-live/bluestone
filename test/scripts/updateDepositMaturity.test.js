const deployTokens = require('../../scripts/javascript/deployTokens.js');
const enableDepositAsset = require('../../scripts/javascript/enableDepositAsset.js');
const updateDepositMaturity = require('../../scripts/javascript/updateDepositMaturity.js');
const { time } = require('openzeppelin-test-helpers');
const { expect } = require('chai');

describe('script: updateDepositMaturity', () => {
  const cb = () => {};
  const network = 'development';

  before(async () => {
    await deployTokens(cb, network);
  });

  contract('DepositManager', () => {
    before(async () => {
      await enableDepositAsset(cb, network, 'ETH');
      await enableDepositAsset(cb, network, 'DAI');
      await enableDepositAsset(cb, network, 'USDT');
    });

    it('succeeds', async () => {
      const res = await updateDepositMaturity(cb, network);
      expect(res).to.be.true;
    });

    context('when update within the same day', () => {
      it('fails', async () => {
        const res = await updateDepositMaturity(cb, network);
        expect(res).to.be.false;
      });
    });

    context('when update next day', () => {
      it('succeeds', async () => {
        await time.increase(time.duration.days(1));
        const res = await updateDepositMaturity(cb, network);
        expect(res).to.be.true;
      });
    });
  });
});
