const Protocol = artifacts.require('ProtocolMock');
const { expectRevert } = require('openzeppelin-test-helpers');
const { createERC20Token, toFixedBN } = require('../../utils/index');
const { expect } = require('chai');

contract('Protocol', async ([owner, anotherAccount]) => {
  let protocol;
  const token = await createERC20Token(owner);

  beforeEach(async () => {
    protocol = await Protocol.new();
  });

  describe('#setAccountGeneralStat', () => {
    it('succeed', async () => {
      await protocol.setAccountGeneralStat(
        anotherAccount,
        'testValue',
        toFixedBN(10),
      );
      const accountGeneralStat = await protocol.getAccountGeneralStat(
        anotherAccount,
        'testValue',
      );

      expect(accountGeneralStat).to.bignumber.equal(toFixedBN(10));
    });
  });

  describe('#getAccountGeneralStat', () => {
    context('in initialization', () => {
      it('should get 0', async () => {
        const accountGeneralStat = await protocol.getAccountGeneralStat(
          owner,
          'testValue',
        );

        expect(accountGeneralStat).to.bignumber.equal(toFixedBN(0));
      });
    });
  });

  describe('#setAccountTokenStat', () => {
    it('succeed', async () => {
      await protocol.setAccountTokenStat(
        anotherAccount,
        token.address,
        'testValue',
        toFixedBN(10),
      );
      const accountTokenStat = await protocol.getAccountTokenStat(
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
        const accountTokenStat = await protocol.getAccountTokenStat(
          owner,
          token.address,
          'testValue',
        );

        expect(accountTokenStat).to.bignumber.equal(toFixedBN(0));
      });
    });
  });
});
