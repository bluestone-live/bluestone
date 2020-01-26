const Configuration = artifacts.require('ConfigurationMock');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const PayableProxy = artifacts.require('PayableProxy');
const WETH9 = artifacts.require('WETH9');
const {
  expectRevert,
  expectEvent,
  constants,
  BN,
} = require('openzeppelin-test-helpers');
const { toFixedBN, createERC20Token } = require('../../utils/index');
const { expect } = require('chai');

contract('Configuration', function([owner]) {
  let configuration, payableProxy, weth;

  beforeEach(async () => {
    weth = await WETH9.new();
    configuration = await Configuration.new();
    payableProxy = await PayableProxy.new(configuration.address, weth.address);
  });

  describe('#setPriceOracle', () => {
    context('when address is valid', () => {
      it('succeeds', async () => {
        const token = await createERC20Token(owner);
        const priceOracle = await SingleFeedPriceOracle.new();
        const { logs } = await configuration.setPriceOracle(
          token.address,
          priceOracle.address,
        );

        expect(
          await configuration.getPriceOracleAddress(token.address),
        ).to.equal(priceOracle.address);

        expectEvent.inLogs(logs, 'SetPriceOracleSucceed', {
          adminAddress: owner,
          tokenAddress: token.address,
          priceOracleAddress: priceOracle.address,
        });
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
        const { logs } = await configuration.setProtocolAddress(owner);

        expect(await configuration.getProtocolAddress()).to.equal(owner);

        expectEvent.inLogs(logs, 'SetProtocolAddressSucceed', {
          adminAddress: owner,
          protocolAddress: owner,
        });
      });
    });
  });

  describe('#setPayableProxy', () => {
    context('when address is valid', () => {
      it('succeeds', async () => {
        const { logs } = await configuration.setPayableProxy(
          payableProxy.address,
        );

        expect(await configuration.getPayableProxy()).to.equal(
          payableProxy.address,
        );

        expectEvent.inLogs(logs, 'SetPayableProxySucceed', {
          adminAddress: owner,
          payableProxyAddress: payableProxy.address,
        });
      });
    });
  });

  describe('#setProtocolReserveRatio', () => {
    context('when ratio is set to 1', () => {
      it('succeeds', async () => {
        const protocolReserveRatio = new BN(1);
        const { logs } = await configuration.setProtocolReserveRatio(
          protocolReserveRatio,
        );

        expect(
          await configuration.getProtocolReserveRatio(),
        ).to.bignumber.equal(protocolReserveRatio);

        expectEvent.inLogs(logs, 'SetProtocolReverveRatioSucceed', {
          adminAddress: owner,
          protocolReserveRatio: protocolReserveRatio,
        });
      });
    });
  });

  describe('#getMaxDistributorFeeRatios', () => {
    context("when the ratio limit didn't set", () => {
      it('get ZERO', async () => {
        const {
          maxDepositDistributorFeeRatio,
          maxLoanDistributorFeeRatio,
        } = await configuration.getMaxDistributorFeeRatios();
        expect(maxDepositDistributorFeeRatio).to.bignumber.equal(toFixedBN(0));
        expect(maxLoanDistributorFeeRatio).to.bignumber.equal(toFixedBN(0));
      });
    });
  });

  describe('#setMaxDistributorFeeRatios', () => {
    const estimateMaxDepositDistributorFeeRatio = toFixedBN(0.01);
    const estimateMaxLoanDistributorFeeRatio = toFixedBN(0.02);
    it('succeeds', async () => {
      await configuration.setMaxDistributorFeeRatios(
        estimateMaxDepositDistributorFeeRatio,
        estimateMaxLoanDistributorFeeRatio,
      );
      const {
        maxDepositDistributorFeeRatio,
        maxLoanDistributorFeeRatio,
      } = await configuration.getMaxDistributorFeeRatios();
      expect(maxDepositDistributorFeeRatio).to.bignumber.equal(
        estimateMaxDepositDistributorFeeRatio,
      );
      expect(maxLoanDistributorFeeRatio).to.bignumber.equal(
        estimateMaxLoanDistributorFeeRatio,
      );
    });
  });
});
