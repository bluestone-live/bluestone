const Protocol = artifacts.require('Protocol');
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const InterestModel = artifacts.require('InterestModel');
const DateTime = artifacts.require('DateTime');
const {
  BN,
  expectRevert,
  expectEvent,
  time,
} = require('@openzeppelin/test-helpers');
const {
  toFixedBN,
  createERC20Token,
  ETHIdentificationAddress,
} = require('../../utils/index');
const { setupTestEnv } = require('../../utils/setupTestEnv');
const { expect } = require('chai');

contract(
  'OwnedUpgradeabilityProxy',
  ([
    owner,
    depositor,
    loaner,
    depositDistributor,
    loanDistributor,
    protocolReserveAddress,
  ]) => {
    let impl, interestModel, loanToken, collateralToken, datetime;
    let proxy, protocol;

    const initialSupply = toFixedBN(10000);

    // configurations
    const depositTerms = [1, 5, 7];
    const minCollateralCoverageRatio = 1.5;
    const liquidationDiscount = 0.05;
    const protocolReserveRatio = 0.07;
    const maxDepositDistributorFeeRatio = 0.01;
    const loanDistributorFeeRatio = 0.02;

    const loanInterestRateLowerBound = 0.1;
    const loanInterestRateUpperBound = 0.15;

    // Token prices
    const loanTokenPrice = 1;
    const collateralTokenPrice = 100;

    // deposit parameters
    const depositAmount = 100;
    const depositTerm = 7;

    before(async () => {
      // Get protocol instance
      impl = await Protocol.new();
      await impl.initialize();
      interestModel = await InterestModel.new();
      loanTokenPriceOracle = await SingleFeedPriceOracle.new();
      collateralTokenPriceOracle = await SingleFeedPriceOracle.new();
      datetime = await DateTime.new();

      // Create token
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);

      // Setup Upgradability Proxy
      proxy = await OwnedUpgradeabilityProxy.new();
      await proxy.upgradeTo(impl.address);

      protocol = await Protocol.at(proxy.address);
      await protocol.initialize();

      // Mint some token to loaner
      await loanToken.mint(loaner, initialSupply);

      // Approve
      await loanToken.approve(protocol.address, initialSupply, {
        from: depositor,
      });
      await collateralToken.approve(protocol.address, initialSupply, {
        from: loaner,
      });
      await loanToken.approve(protocol.address, initialSupply, {
        from: loaner,
      });

      // Setup price oracles
      await protocol.setPriceOracle(
        loanToken.address,
        loanTokenPriceOracle.address,
      );
      await protocol.setPriceOracle(
        collateralToken.address,
        collateralTokenPriceOracle.address,
      );

      await setupTestEnv(
        [
          owner,
          depositor,
          loaner,
          depositDistributor,
          loanDistributor,
          protocolReserveAddress,
        ],
        protocol,
        interestModel,
        depositTerms,
        [loanToken, { address: ETHIdentificationAddress }],
        [loanToken],
        [
          {
            loanTokenAddress: loanToken.address,
            collateralTokenAddress: collateralToken.address,
            minCollateralCoverageRatio,
            liquidationDiscount,
          },
          {
            loanTokenAddress: loanToken.address,
            collateralTokenAddress: ETHIdentificationAddress,
            minCollateralCoverageRatio,
            liquidationDiscount,
          },
        ],
        [loanInterestRateLowerBound, loanInterestRateLowerBound],
        [loanInterestRateUpperBound, loanInterestRateUpperBound],
        protocolReserveRatio,
        maxDepositDistributorFeeRatio,
        loanDistributorFeeRatio,
      );

      // Post prices
      await loanTokenPriceOracle.setPrice(toFixedBN(loanTokenPrice));
      await collateralTokenPriceOracle.setPrice(
        toFixedBN(collateralTokenPrice),
      );
    });

    describe('owner', function() {
      it('has an owner', async function() {
        const proxyOwner = await proxy.proxyOwner();
        const protocolOwner = await impl.owner();

        expect(proxyOwner).equal(owner);
        expect(proxyOwner).equal(protocolOwner);
      });
    });

    describe('implementation', function() {
      it('equals origin protocol address', async () => {
        const v0 = await proxy.implementation();
        expect(v0).equal(impl.address);
      });
    });

    describe('calling', () => {
      let depositId;

      it('calls deposit', async () => {
        const { logs: depositLogs } = await protocol.deposit(
          loanToken.address,
          toFixedBN(depositAmount),
          depositTerm,
          depositDistributor,
          {
            from: depositor,
          },
        );
        depositId = depositLogs.filter(log => log.event === 'DepositSucceed')[0]
          .args.recordId;
        expectEvent.inLogs(depositLogs, 'DepositSucceed', {
          accountAddress: depositor,
          recordId: depositId,
          amount: toFixedBN(depositAmount),
        });

        const newBalance = await loanToken.balanceOf(protocol.address);

        expect(toFixedBN(depositAmount).toString()).equal(
          newBalance.toString(),
        );
      });
    });

    describe('upgrade', () => {
      let depositIdBeforeUpgrade;

      before(async () => {
        const { logs: depositLogs } = await protocol.deposit(
          loanToken.address,
          toFixedBN(depositAmount),
          depositTerm,
          depositDistributor,
          {
            from: depositor,
          },
        );

        depositIdBeforeUpgrade = depositLogs.filter(
          log => log.event === 'DepositSucceed',
        )[0].args.recordId;
      });

      context('after upgrading the implementation', () => {
        before(async () => {
          const newImpl = await Protocol.new();
          await proxy.upgradeTo(newImpl.address);
        });

        it('can retrieve an existing deposit record', async () => {
          const record = await protocol.getDepositRecordById(
            depositIdBeforeUpgrade,
          );
          expect(new BN(record.depositTerm)).to.bignumber.equal(
            new BN(depositTerm),
          );
          expect(new BN(record.depositAmount)).to.bignumber.equal(
            toFixedBN(depositAmount),
          );
        });

        it('deposits successfully', async () => {
          const { logs: depositLogs } = await protocol.deposit(
            loanToken.address,
            toFixedBN(depositAmount),
            depositTerm,
            depositDistributor,
            {
              from: depositor,
            },
          );
          depositId = depositLogs.filter(
            log => log.event === 'DepositSucceed',
          )[0].args.recordId;
          expectEvent.inLogs(depositLogs, 'DepositSucceed', {
            accountAddress: depositor,
            recordId: depositId,
            amount: toFixedBN(depositAmount),
          });
        });
      });
    });
  },
);
