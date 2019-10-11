const AccountManager = artifacts.require('AccountManagerMock');
const { createERC20Token, toFixedBN } = require('../../utils/index');
const { expect } = require('chai');

contract('AccountManager', ([owner, anotherAccount]) => {
  let accountManager, token;

  beforeEach(async () => {
    token = await createERC20Token(owner);
    accountManager = await AccountManager.new();
  });

  describe('#setAccountGeneralStat', () => {
    it('succeed', async () => {
      await accountManager.setAccountGeneralStat(
        anotherAccount,
        'testValue',
        toFixedBN(10),
      );
      const accountGeneralStat = await accountManager.getAccountGeneralStat(
        anotherAccount,
        'testValue',
      );

      expect(accountGeneralStat).to.bignumber.equal(toFixedBN(10));
    });
  });

  describe('#getAccountGeneralStat', () => {
    context('in initialization', () => {
      it('should get 0', async () => {
        const accountGeneralStat = await accountManager.getAccountGeneralStat(
          owner,
          'testValue',
        );

        expect(accountGeneralStat).to.bignumber.equal(toFixedBN(0));
      });
    });
  });

  describe('#setAccountTokenStat', () => {
    it('succeed', async () => {
      await accountManager.setAccountTokenStat(
        anotherAccount,
        token.address,
        'testValue',
        toFixedBN(10),
      );
      const accountTokenStat = await accountManager.getAccountTokenStat(
        anotherAccount,
        token.address,
        'testValue',
      );

      expect(accountTokenStat).to.bignumber.equal(toFixedBN(10));
    });
  });

  describe('#getAccountTokenStat', () => {
    context('in initialization', () => {
      it('should get 0', async () => {
        const accountTokenStat = await accountManager.getAccountTokenStat(
          owner,
          token.address,
          'testValue',
        );

        expect(accountTokenStat).to.bignumber.equal(toFixedBN(0));
      });
    });
  });
});
