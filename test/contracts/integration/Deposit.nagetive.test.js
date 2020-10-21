const Protocol = artifacts.require('Protocol');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const InterestModel = artifacts.require('InterestModel');
const DateTime = artifacts.require('DateTime');
const {
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
  'Protocol',
  ([
    owner,
    depositor,
    loaner,
    depositDistributor,
    loanDistributor,
    protocolReserveAddress,
  ]) => {
    let protocol, interestModel, loanToken, collateralToken, datetime;

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
      protocol = await Protocol.new();
      await protocol.initialize();
      interestModel = await InterestModel.new();
      loanTokenPriceOracle = await SingleFeedPriceOracle.new();
      collateralTokenPriceOracle = await SingleFeedPriceOracle.new();
      datetime = await DateTime.new();

      // Create token
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);

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

    describe('Deposit token flow', () => {
      context("When deposit token didn't enabled", () => {
        before(async () => {
          await protocol.disableDepositToken(loanToken.address);
        });
        it('revert', async () => {
          await expectRevert(
            protocol.deposit(
              loanToken.address,
              toFixedBN(depositAmount),
              depositTerm,
              depositDistributor,
              {
                from: depositor,
              },
            ),
            'DepositManager: invalid deposit token',
          );
        });
      });
      context('When deposit token disabled after deposit', () => {
        let earlyWithdrawDepositId;
        let maturedDepositId;

        before(async () => {
          // reset
          await protocol.enableDepositToken(loanToken.address);

          const { logs: depositLogs1 } = await protocol.deposit(
            loanToken.address,
            toFixedBN(depositAmount),
            depositTerm,
            depositDistributor,
            {
              from: depositor,
            },
          );
          earlyWithdrawDepositId = depositLogs1.filter(
            log => log.event === 'DepositSucceed',
          )[0].args.recordId;

          const { logs: depositLogs2 } = await protocol.deposit(
            loanToken.address,
            toFixedBN(depositAmount),
            depositTerm,
            depositDistributor,
            {
              from: depositor,
            },
          );
          maturedDepositId = depositLogs2.filter(
            log => log.event === 'DepositSucceed',
          )[0].args.recordId;

          await protocol.disableDepositToken(loanToken.address);
        });

        it('early withdraw succeed', async () => {
          const isEarlyWithdrawable = await protocol.isDepositEarlyWithdrawable(
            earlyWithdrawDepositId,
          );
          expect(isEarlyWithdrawable).to.be.true;

          const { logs: withdrawLogs } = await protocol.earlyWithdraw(
            earlyWithdrawDepositId,
            {
              from: depositor,
            },
          );
          expectEvent.inLogs(withdrawLogs, 'EarlyWithdrawSucceed', {
            accountAddress: depositor,
            recordId: earlyWithdrawDepositId,
            amount: toFixedBN(depositAmount),
          });
        });

        it('withdraw succeed', async () => {
          await time.increase(time.duration.days(depositTerm + 1));

          const currentPoolId = await datetime.toDays();

          const { poolId } = await protocol.getDepositRecordById(
            maturedDepositId,
          );

          expect(Number.parseInt(poolId, 10)).to.lt(
            Number.parseInt(currentPoolId.toString(), 10),
          );

          const { logs: withdrawLogs } = await protocol.withdraw(
            maturedDepositId,
            {
              from: depositor,
            },
          );
          expectEvent.inLogs(withdrawLogs, 'WithdrawSucceed', {
            accountAddress: depositor,
            recordId: maturedDepositId,
            amount: toFixedBN(depositAmount),
          });
        });

        it('revert deposit', async () => {
          await expectRevert(
            protocol.deposit(
              loanToken.address,
              toFixedBN(depositAmount),
              depositTerm,
              depositDistributor,
              {
                from: depositor,
              },
            ),
            'DepositManager: invalid deposit token',
          );
        });
      });
      context("When deposit term didn't enabled", () => {
        before(async () => {
          // reset
          await protocol.enableDepositToken(loanToken.address);

          await protocol.disableDepositTerm(depositTerm);
        });

        it('revert', async () => {
          await expectRevert(
            protocol.deposit(
              loanToken.address,
              toFixedBN(depositAmount),
              depositTerm,
              depositDistributor,
              {
                from: depositor,
              },
            ),
            'DepositManager: invalid deposit term',
          );
        });
      });
      context('When deposit term disabled after deposit', () => {
        let depositId;
        let depositId2;

        before(async () => {
          await protocol.enableDepositTerm(depositTerm);

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

          const { logs: depositLogs2 } = await protocol.deposit(
            loanToken.address,
            toFixedBN(depositAmount),
            depositTerm,
            depositDistributor,
            {
              from: depositor,
            },
          );
          depositId2 = depositLogs2.filter(
            log => log.event === 'DepositSucceed',
          )[0].args.recordId;

          await protocol.disableDepositTerm(depositTerm);
        });

        it('early withdraw succeed', async () => {
          const isEarlyWithdrawable = await protocol.isDepositEarlyWithdrawable(
            depositId,
          );
          expect(isEarlyWithdrawable).to.be.true;

          const { logs: withdrawLogs } = await protocol.earlyWithdraw(
            depositId,
            {
              from: depositor,
            },
          );
          expectEvent.inLogs(withdrawLogs, 'EarlyWithdrawSucceed', {
            accountAddress: depositor,
            recordId: depositId,
            amount: toFixedBN(depositAmount),
          });
        });
        it('withdraw succeed', async () => {
          await time.increase(time.duration.days(depositTerm + 1));

          const currentPoolId = await datetime.toDays();

          const { poolId } = await protocol.getDepositRecordById(depositId2);

          expect(Number.parseInt(poolId, 10)).to.lt(
            Number.parseInt(currentPoolId.toString(), 10),
          );

          const { logs: withdrawLogs } = await protocol.withdraw(depositId2, {
            from: depositor,
          });
          expectEvent.inLogs(withdrawLogs, 'WithdrawSucceed', {
            accountAddress: depositor,
            recordId: depositId2,
            amount: toFixedBN(depositAmount),
          });
        });
        it('revert deposit', async () => {
          await expectRevert(
            protocol.deposit(
              loanToken.address,
              toFixedBN(depositAmount),
              depositTerm,
              depositDistributor,
              {
                from: depositor,
              },
            ),
            'DepositManager: invalid deposit term',
          );
        });
      });
      context('When protocol paused', () => {
        let depositId;

        before(async () => {
          // reset
          await protocol.enableDepositTerm(depositTerm);

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

          await protocol.pause();
        });

        it('revert deposit', async () => {
          await expectRevert(
            protocol.deposit(
              loanToken.address,
              toFixedBN(depositAmount),
              depositTerm,
              depositDistributor,
              {
                from: depositor,
              },
            ),
            'Pausable: paused',
          );
        });
        it('fetch deposit records succeed', async () => {
          const records = await protocol.getDepositRecordsByAccount(depositor);

          expect(records.length).to.gt(0);
        });
        it('revert early withdraw', async () => {
          await expectRevert(
            protocol.earlyWithdraw(depositId, {
              from: depositor,
            }),
            'Pausable: paused',
          );
        });
        it('revert withdraw', async () => {
          await expectRevert(
            protocol.withdraw(depositId, {
              from: depositor,
            }),
            'Pausable: paused',
          );
        });
      });
    });
  },
);
