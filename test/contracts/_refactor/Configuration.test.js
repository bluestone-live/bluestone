const Configuration = artifacts.require('ConfigurationMock');
const {
  expectRevert,
  expectEvent,
  constants,
  BN,
} = require('openzeppelin-test-helpers');
const { expect } = require('chai');

contract('Configuration', function([owner]) {
  let configuration;

  beforeEach(async () => {
    configuration = await Configuration.new();
  });

  describe('#setPriceOracleAddress', () => {
    context('when address is invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          configuration.setProtocolAddress(constants.ZERO_ADDRESS),
          'Configuration: invalid protocol address',
        );
      });
    });

    context('when address is valid', () => {
      it('succeeds', async () => {
        await configuration.setPriceOracleAddress(owner);
        expect(await configuration.getPriceOracleAddress()).to.equal(owner);
      });
    });
  });

  describe('#setProtocolAddress', () => {
    context('when address is invalid', () => {
      it('reverts', async () => {
        await expectRevert(
          configuration.setProtocolAddress(constants.ZERO_ADDRESS),
          'Configuration: invalid protocol address',
        );
      });
    });

    context('when address is valid', () => {
      it('succeeds', async () => {
        await configuration.setProtocolAddress(owner);
        expect(await configuration.getProtocolAddress()).to.equal(owner);
      });
    });
  });

  describe('#setProtocolReserveRatio', () => {
    context('when ratio is set to 1', () => {
      it('succeeds', async () => {
        await configuration.setProtocolReserveRatio(1);
        expect(
          await configuration.getProtocolReserveRatio(),
        ).to.bignumber.equal(new BN(1));
      });
    });

    context('when ratio is set to 2', () => {
      it('succeeds', async () => {
        await configuration.setProtocolReserveRatio(2);
        expect(
          await configuration.getProtocolReserveRatio(),
        ).to.bignumber.equal(new BN(2));
      });
    });
  });

  describe('#lockUserActions', () => {
    it('succeeds', async () => {
      const { logs } = await configuration.lockUserActions();
      expect(await configuration.isUserActionsLocked()).to.true;
      expectEvent.inLogs(logs, 'LockUserActions');
    });
  });

  describe('#unlockUserActions', () => {
    it('succeeds', async () => {
      const { logs } = await configuration.unlockUserActions();
      expect(await configuration.isUserActionsLocked()).to.false;
      expectEvent.inLogs(logs, 'UnlockUserActions');
    });
  });
});
