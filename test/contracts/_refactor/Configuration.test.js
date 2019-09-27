const Protocol = artifacts.require('ProtocolMock');
const {
  expectRevert,
  expectEvent,
  constants,
  BN,
} = require('openzeppelin-test-helpers');
const { expect } = require('chai');

contract('Protocol', function([owner]) {
  let protocol;

  beforeEach(async () => {
    protocol = await Protocol.new();
  });

  describe('#setPriceOracleAddress', () => {
    context('when address is invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          protocol.setProtocolAddress(constants.ZERO_ADDRESS),
          'Configuration: invalid protocol address',
        );
      });
    });

    context('when address is valid', () => {
      it('succeeds', async () => {
        await protocol.setPriceOracleAddress(owner);
        expect(await protocol.getPriceOracleAddress()).to.equal(owner);
      });
    });
  });

  describe('#setProtocolAddress', () => {
    context('when address is invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          protocol.setProtocolAddress(constants.ZERO_ADDRESS),
          'Configuration: invalid protocol address',
        );
      });
    });

    context('when address is valid', () => {
      it('succeeds', async () => {
        await protocol.setProtocolAddress(owner);
        expect(await protocol.getProtocolAddress()).to.equal(owner);
      });
    });
  });

  describe('#setProtocolReserveRatio', () => {
    context('when ratio is set to 1', () => {
      it('succeeds', async () => {
        await protocol.setProtocolReserveRatio(1);
        expect(await protocol.getProtocolReserveRatio()).to.bignumber.equal(
          new BN(1),
        );
      });
    });

    context('when ratio is set to 2', () => {
      it('succeeds', async () => {
        await protocol.setProtocolReserveRatio(2);
        expect(await protocol.getProtocolReserveRatio()).to.bignumber.equal(
          new BN(2),
        );
      });
    });
  });

  describe('#lockUserActions', () => {
    context('when lock user actions', () => {
      it('succeeds', async () => {
        const { logs } = await protocol.lockUserActions();
        expect(await protocol.isUserActionsLocked()).to.true;
        expectEvent.inLogs(logs, 'LockUserActions');
      });
    });

    context('when unlock user actions', () => {
      it('succeeds', async () => {
        const { logs } = await protocol.unlockUserActions();
        expect(await protocol.isUserActionsLocked()).to.false;
        expectEvent.inLogs(logs, 'UnlockUserActions');
      });
    });

    context('when lock user actions again', () => {
      it('succeeds', async () => {
        const { logs } = await protocol.lockUserActions();
        expect(await protocol.isUserActionsLocked()).to.true;
        expectEvent.inLogs(logs, 'LockUserActions');
      });
    });
  });
});
