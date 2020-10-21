const Protocol = artifacts.require('Protocol');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const InterestModel = artifacts.require('InterestModel');
const DateTime = artifacts.require('DateTime');
const { expectEvent, BN, time } = require('@openzeppelin/test-helpers');
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

    // loan parameters
    const loanAmount = 100;
    const collateralAmount = 20;
    const loanTerm = 7;

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

    describe('Deposit tokens flow', () => {
      let depositId;
      let protocolOriginalBalance;

      before(async () => {
        protocolOriginalBalance = await loanToken.balanceOf(protocol.address);
      });

      it('succeed', async () => {
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
      });
      it('increase the token amount of protocol contract', async () => {
        const protocolBalance = await loanToken.balanceOf(protocol.address);

        expect(
          new BN(protocolBalance).sub(new BN(protocolOriginalBalance)),
        ).to.bignumber.equal(toFixedBN(depositAmount));
      });
      it('modify the pool data of specific pool', async () => {
        const currentPoolId = await datetime.toDays();
        const pools = await protocol.getPoolsByToken(loanToken.address);

        const pool = pools.find(
          p =>
            p.poolId ===
            (Number.parseInt(currentPoolId, 10) + depositTerm).toString(),
        );

        expect(pool.depositAmount).to.equal(
          toFixedBN(depositAmount).toString(),
        );
        expect(pool.availableAmount).to.equal(
          toFixedBN(depositAmount).toString(),
        );
        expect(pool.totalDepositWeight).to.equal(
          (await interestModel.getDepositWeight(
            toFixedBN(depositAmount),
            term,
          )).toString(),
        );
      });
      it('create a new record for user account', async () => {
        const records = await protocol.getDepositRecordsByAccount(depositor);

        expect(records.length).to.equal(1);
        expect(records[0].depositId).to.equal(depositId);
      });

      context('When nobody loan', () => {
        let originalDepositorBalance;

        before(async () => {
          originalDepositorBalance = await loanToken.balanceOf(depositor);
        });

        it('can be early withdraw', async () => {
          const isEarlyWithdrawable = await protocol.isDepositEarlyWithdrawable(
            depositId,
          );
          expect(isEarlyWithdrawable).to.be.true;
        });
        it('early withdrew succeed', async () => {
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
        it('closed the record', async () => {
          const { withdrewAt } = await protocol.getDepositRecordById(depositId);

          expect(new BN(withdrewAt)).to.bignumber.gt(new BN(0));
        });
        it('transfer correct amount to user account', async () => {
          const currentDepositorBalance = await loanToken.balanceOf(depositor);

          expect(
            new BN(currentDepositorBalance).sub(
              new BN(originalDepositorBalance),
            ),
          ).to.bignumber.equal(toFixedBN(depositAmount));
        });
      });

      context('When somebody loaned', () => {
        let loanId;
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
          depositId = depositLogs.filter(
            log => log.event === 'DepositSucceed',
          )[0].args.recordId;

          const { logs: loanLogs } = await protocol.loan(
            loanToken.address,
            collateralToken.address,
            toFixedBN(loanAmount),
            toFixedBN(collateralAmount),
            loanTerm,
            loanDistributor,
            {
              from: loaner,
            },
          );
          loanId = loanLogs.filter(log => log.event === 'LoanSucceed')[0].args
            .recordId;
        });

        it("can't be early withdraw", async () => {
          const isEarlyWithdrawable = await protocol.isDepositEarlyWithdrawable(
            depositId,
          );

          expect(isEarlyWithdrawable).to.be.false;
        });
        it('can get correct interest', async () => {
          const currentPoolId = await datetime.toDays();
          const pools = await protocol.getPoolsByToken(loanToken.address);

          const pool = pools.find(
            p =>
              p.poolId ===
              (Number.parseInt(currentPoolId, 10) + depositTerm).toString(),
          );
          const { interest } = await protocol.getDepositRecordById(depositId);
          const totalInterest = new BN(pool.loanInterest);

          expect(new BN(interest)).to.bignumber.equal(
            totalInterest
              .sub(
                totalInterest
                  .mul(toFixedBN(protocolReserveRatio))
                  .div(toFixedBN(1)),
              )
              .sub(
                totalInterest
                  .mul(toFixedBN(maxDepositDistributorFeeRatio))
                  .div(toFixedBN(1)),
              )
              .sub(
                totalInterest
                  .mul(toFixedBN(loanDistributorFeeRatio))
                  .div(toFixedBN(1)),
              ),
          );
        });
        it('can be early withdraw after loan repaid', async () => {
          const { remainingDebt } = await protocol.getLoanRecordById(loanId);

          await protocol.repayLoan(loanId, remainingDebt, { from: loaner });

          const isEarlyWithdrawable = await protocol.isDepositEarlyWithdrawable(
            depositId,
          );

          expect(isEarlyWithdrawable).to.be.true;
        });
        it('transfer principal to user account after early withdraw', async () => {
          const originalDepositorBalance = await loanToken.balanceOf(depositor);
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

          const depositorBalance = await loanToken.balanceOf(depositor);
          expect(
            new BN(depositorBalance).sub(new BN(originalDepositorBalance)),
          ).to.bignumber.equal(toFixedBN(depositAmount));
        });
        it('matured after the date increased', async () => {
          await time.increase(time.duration.days(1));

          const currentPoolId = await datetime.toDays();

          const { logs: depositLogs } = await protocol.deposit(
            loanToken.address,
            toFixedBN(depositAmount),
            depositTerm,
            depositDistributor,
            {
              from: depositor,
            },
          );

          maturedDepositId = depositLogs.filter(
            log => log.event === 'DepositSucceed',
          )[0].args.recordId;

          const { logs: loanLogs } = await protocol.loan(
            loanToken.address,
            collateralToken.address,
            toFixedBN(loanAmount),
            toFixedBN(collateralAmount),
            loanTerm,
            loanDistributor,
            {
              from: loaner,
            },
          );

          loanId = loanLogs.filter(log => log.event === 'LoanSucceed')[0].args
            .recordId;

          const { remainingDebt } = await protocol.getLoanRecordById(loanId);

          await protocol.repayLoan(loanId, remainingDebt, { from: loaner });

          await time.increase(time.duration.days(loanTerm + 1));

          const { poolId } = await protocol.getDepositRecordById(
            maturedDepositId,
          );

          expect(Number.parseInt(poolId, 10)).to.gt(
            Number.parseInt(currentPoolId),
          );
        });
        it('withdrew succeed', async () => {
          const { interest } = await protocol.getDepositRecordById(
            maturedDepositId,
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
            amount: toFixedBN(depositAmount).add(new BN(interest)),
          });
        });
      });
    });

    describe('Deposit ETH flow', () => {
      let depositId;
      let prevProtocolETHBalance;
      let prevDepositRecordsCount;

      before(async () => {
        prevProtocolETHBalance = await web3.eth.getBalance(protocol.address);
        const records = await protocol.getDepositRecordsByAccount(depositor);
        prevDepositRecordsCount = records.length;
      });

      it('succeed', async () => {
        const { logs: depositLogs } = await protocol.deposit(
          ETHIdentificationAddress,
          toFixedBN(depositAmount),
          depositTerm,
          depositDistributor,
          {
            from: depositor,
            value: toFixedBN(depositAmount),
          },
        );

        depositId = depositLogs.filter(log => log.event === 'DepositSucceed')[0]
          .args.recordId;
        expectEvent.inLogs(depositLogs, 'DepositSucceed', {
          accountAddress: depositor,
          recordId: depositId,
          amount: toFixedBN(depositAmount),
        });
      });
      it('increase ETH amount of protocol contract', async () => {
        const protocolETHBalance = await web3.eth.getBalance(protocol.address);

        expect(
          new BN(protocolETHBalance).sub(new BN(prevProtocolETHBalance)),
        ).to.bignumber.equal(toFixedBN(depositAmount));
      });
      it('increase the deposit amount of specific pool', async () => {
        const currentPoolId = await datetime.toDays();
        const pools = await protocol.getPoolsByToken(ETHIdentificationAddress);

        const pool = pools.find(
          p =>
            p.poolId ===
            (Number.parseInt(currentPoolId, 10) + depositTerm).toString(),
        );

        expect(pool.depositAmount).to.equal(
          toFixedBN(depositAmount).toString(),
        );
        expect(pool.availableAmount).to.equal(
          toFixedBN(depositAmount).toString(),
        );
        expect(pool.totalDepositWeight).to.equal(
          (await interestModel.getDepositWeight(
            toFixedBN(depositAmount),
            term,
          )).toString(),
        );
      });
      it('create a new record for user account', async () => {
        const records = await protocol.getDepositRecordsByAccount(depositor);

        expect(records.length).to.equal(prevDepositRecordsCount + 1);
      });

      context('When nobody loan', () => {
        it('can be early withdraw', async () => {
          const isEarlyWithdrawable = await protocol.isDepositEarlyWithdrawable(
            depositId,
          );
          expect(isEarlyWithdrawable).to.be.true;
        });
        it('early withdrew succeed', async () => {
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
      });
      // We didn't support loan ETH so we don't need to test those cases about ETH be loaned
    });
  },
);
