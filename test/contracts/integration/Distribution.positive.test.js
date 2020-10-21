const Protocol = artifacts.require('Protocol');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const InterestModel = artifacts.require('InterestModel');
const DateTime = artifacts.require('DateTime');
const { BN, time } = require('@openzeppelin/test-helpers');
const { toFixedBN, createERC20Token } = require('../../utils/index');
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
    interestReserveAddress,
  ]) => {
    let protocol, interestModel, loanToken, collateralToken, datetime;

    const initialSupply = toFixedBN(10000);
    const ZERO = toFixedBN(0);

    // configurations
    const depositTerms = [1, 5, 7];
    const maxLoanTerm = 7;
    const minCollateralCoverageRatio = 1.5;
    const liquidationDiscount = 0.05;
    const protocolReserveRatio = 0.07;
    const depositDistributorFeeRatio = 0.01;
    const loanDistributorFeeRatio = 0.02;

    const loanInterestRateLowerBound = 0.1;
    const loanInterestRateUpperBound = 0.15;

    let currentLoanInterestRate;

    // Token prices
    const loanTokenPrice = 1;
    const collateralTokenPrice = 100;

    // deposit parameters
    const depositAmount = 1000;
    const depositTerm = 7;

    // loan parameters
    const loanAmount = 1000;
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
          interestReserveAddress,
        ],
        protocol,
        interestModel,
        depositTerms,
        [loanToken],
        [loanToken],
        [
          {
            loanTokenAddress: loanToken.address,
            collateralTokenAddress: collateralToken.address,
            minCollateralCoverageRatio,
            liquidationDiscount,
          },
        ],
        [loanInterestRateLowerBound],
        [loanInterestRateUpperBound],
        protocolReserveRatio,
        depositDistributorFeeRatio,
        loanDistributorFeeRatio,
      );

      // Post prices
      await loanTokenPriceOracle.setPrice(toFixedBN(loanTokenPrice));
      await collateralTokenPriceOracle.setPrice(
        toFixedBN(collateralTokenPrice),
      );

      // Get current loan interest rate
      currentLoanInterestRate = await interestModel.getLoanInterestRate(
        loanToken.address,
        loanTerm,
        maxLoanTerm,
      );
    });

    describe('Withdraw matured deposit flow', () => {
      let depositId;
      let loanId;
      let totalInterest;

      before(async () => {
        // Create deposit record
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

        // Create loan record
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

      it('returns correct pool data', async () => {
        const poolList = await protocol.getPoolsByToken(loanToken.address);

        for (let i = 0; i < poolList.length; i++) {
          const pool = poolList[i];

          if (i === poolList.length - 1) {
            expect(new BN(pool.depositAmount)).to.bignumber.equal(
              toFixedBN(depositAmount),
            );
            expect(new BN(pool.availableAmount)).to.bignumber.equal(
              toFixedBN(depositAmount).sub(toFixedBN(loanAmount)),
            );
            expect(new BN(pool.loanInterest)).to.bignumber.equal(
              toFixedBN(loanAmount)
                .mul(currentLoanInterestRate)
                .div(toFixedBN(1))
                .mul(new BN(loanTerm))
                .div(new BN(365)),
            );
            totalInterest = new BN(pool.loanInterest);
          } else {
            expect(new BN(pool.depositAmount)).to.bignumber.equal(ZERO);
            expect(new BN(pool.availableAmount)).to.bignumber.equal(ZERO);
            expect(new BN(pool.loanInterest)).to.bignumber.equal(ZERO);
          }
        }
      });

      it('returns correct interest for depositor', async () => {
        const { interest } = await protocol.getDepositRecordById(depositId);

        expect(new BN(interest)).to.bignumber.equal(
          totalInterest
            .sub(
              totalInterest
                .mul(toFixedBN(protocolReserveRatio))
                .div(toFixedBN(1)),
            )
            .sub(
              totalInterest
                .mul(toFixedBN(depositDistributorFeeRatio))
                .div(toFixedBN(1)),
            )
            .sub(
              totalInterest
                .mul(toFixedBN(loanDistributorFeeRatio))
                .div(toFixedBN(1)),
            ),
        );
      });
      it('transfer distributor fee to loan distributor after loan fully repaid', async () => {
        const prevLoanDistributorBalance = await loanToken.balanceOf(
          loanDistributor,
        );
        const { remainingDebt } = await protocol.getLoanRecordById(loanId);

        await protocol.repayLoan(loanId, remainingDebt, {
          from: loaner,
        });

        const loanDistributorBalance = await loanToken.balanceOf(
          loanDistributor,
        );

        expect(
          loanDistributorBalance.sub(prevLoanDistributorBalance),
        ).to.bignumber.equal(
          totalInterest
            .mul(toFixedBN(loanDistributorFeeRatio))
            .div(toFixedBN(1)),
        );
      });
      it('returns correct pool data when day passes', async () => {
        for (let j = 0; j < depositTerm; j++) {
          await time.increase(time.duration.days(1));

          const poolList = await protocol.getPoolsByToken(loanToken.address);

          for (let i = 0; i < poolList.length; i++) {
            const pool = poolList[i];

            if (i === depositTerm - j - 1) {
              const interest = toFixedBN(loanAmount)
                .mul(currentLoanInterestRate)
                .div(toFixedBN(1))
                .mul(new BN(loanTerm))
                .div(new BN(365));

              expect(new BN(pool.depositAmount)).to.bignumber.equal(
                toFixedBN(depositAmount),
              );
              expect(new BN(pool.availableAmount)).to.bignumber.equal(
                toFixedBN(depositAmount)
                  .add(
                    interest.sub(
                      interest
                        .mul(toFixedBN(loanDistributorFeeRatio))
                        .div(toFixedBN(1)),
                    ),
                  )
                  // to solve the calculation difference between JS and solidity
                  .add(new BN(1)),
              );
              expect(new BN(pool.loanInterest)).to.bignumber.equal(interest);
            } else {
              expect(new BN(pool.depositAmount)).to.bignumber.equal(ZERO);
              expect(new BN(pool.availableAmount)).to.bignumber.equal(ZERO);
              expect(new BN(pool.loanInterest)).to.bignumber.equal(ZERO);
            }
          }
        }
      });
      it('transfer correct amount to depositor after withdraw deposit', async () => {
        await time.increase(time.duration.days(1));

        const {
          depositAmount: depositAmountForRecord,
          poolId,
          interest,
        } = await protocol.getDepositRecordById(depositId);

        const currentPoolId = Number.parseInt(
          (await datetime.toDays()).toString(),
          10,
        );

        expect(Number.parseInt(poolId, 10)).to.be.lt(currentPoolId);

        const prevDepositorBalance = await loanToken.balanceOf(depositor);
        const prevDepositDistributorBalance = await loanToken.balanceOf(
          depositDistributor,
        );
        const prevProtocolReserveBalance = await loanToken.balanceOf(
          interestReserveAddress,
        );

        await protocol.withdraw(depositId, {
          from: depositor,
        });

        const depositorBalance = await loanToken.balanceOf(depositor);
        const depositDistributorBalance = await loanToken.balanceOf(
          depositDistributor,
        );
        const protocolReserveBalance = await loanToken.balanceOf(
          interestReserveAddress,
        );

        expect(depositorBalance.sub(prevDepositorBalance)).to.bignumber.equal(
          new BN(depositAmountForRecord).add(new BN(interest)),
        );
        expect(
          depositDistributorBalance.sub(prevDepositDistributorBalance),
        ).to.bignumber.equal(
          totalInterest
            .mul(toFixedBN(depositDistributorFeeRatio))
            .div(toFixedBN(1)),
        );
        expect(
          protocolReserveBalance.sub(prevProtocolReserveBalance),
        ).to.bignumber.equal(
          totalInterest.mul(toFixedBN(protocolReserveRatio)).div(toFixedBN(1)),
        );
      });
      it('transfer correct balance to protocol contract', async () => {
        const protocolContractBalance = await loanToken.balanceOf(
          protocol.address,
        );

        expect(protocolContractBalance).to.bignumber.equal(ZERO);
      });
    });

    describe('Early withdraw deposit flow', () => {
      let otherDeposits, depositId;

      before(async () => {
        // Create deposit record
        const { logs: otherDepositsLogs } = await protocol.deposit(
          loanToken.address,
          toFixedBN(depositAmount),
          depositTerm,
          depositDistributor,
          {
            from: depositor,
          },
        );
        otherDeposits = otherDepositsLogs.filter(
          log => log.event === 'DepositSucceed',
        )[0].args.recordId;

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

        // Create loan record
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

      it('only transfer principal to depositor after early withdraw', async () => {
        await time.increase(time.duration.days(1));

        const {
          depositAmount: depositAmountForRecord,
        } = await protocol.getDepositRecordById(depositId);

        // TODO(desmond): check maturedAt >= now

        const isEarlyWithdrawable = await protocol.isDepositEarlyWithdrawable(
          depositId,
        );

        expect(isEarlyWithdrawable).to.be.true;

        const prevDepositorBalance = await loanToken.balanceOf(depositor);
        const prevDepositDistributorBalance = await loanToken.balanceOf(
          depositDistributor,
        );
        const prevProtocolReserveBalance = await loanToken.balanceOf(
          interestReserveAddress,
        );

        await protocol.earlyWithdraw(depositId, {
          from: depositor,
        });

        const depositorBalance = await loanToken.balanceOf(depositor);
        const depositDistributorBalance = await loanToken.balanceOf(
          depositDistributor,
        );
        const protocolReserveBalance = await loanToken.balanceOf(
          interestReserveAddress,
        );

        expect(depositorBalance.sub(prevDepositorBalance)).to.bignumber.equal(
          new BN(depositAmountForRecord),
        );
        expect(
          depositDistributorBalance.sub(prevDepositDistributorBalance),
        ).to.bignumber.equal(ZERO);
        expect(
          protocolReserveBalance.sub(prevProtocolReserveBalance),
        ).to.bignumber.equal(ZERO);
      });
      it('returns false when other deposit query is deposit early withdrawable', async () => {
        const isEarlyWithdrawable = await protocol.isDepositEarlyWithdrawable(
          otherDeposits,
        );

        expect(isEarlyWithdrawable).to.be.false;
      });
      it('transfer correct balance to protocol contract', async () => {
        const protocolContractBalance = await loanToken.balanceOf(
          protocol.address,
        );

        expect(protocolContractBalance).to.bignumber.equal(ZERO);
      });
    });
  },
);
