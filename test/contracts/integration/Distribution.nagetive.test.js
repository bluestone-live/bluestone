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
    liquidator,
  ]) => {
    let protocol, interestModel, loanToken, collateralToken;

    const initialSupply = toFixedBN(10000);

    // configurations
    const depositTerms = [1, 5, 7];
    const maxLoanTerm = 7;
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
    const ETHPrice = 2000;

    // deposit parameters
    const depositAmount = 100;
    const depositTerm = 7;

    // loan parameters
    const loanAmount = 100;
    const collateralAmount = 20;
    const loanTerm = 1;

    before(async () => {
      // Get protocol instance
      protocol = await Protocol.new();
      interestModel = await InterestModel.new();
      loanTokenPriceOracle = await SingleFeedPriceOracle.new();
      collateralTokenPriceOracle = await SingleFeedPriceOracle.new();
      ETHPriceOracle = await SingleFeedPriceOracle.new();
      datetime = await DateTime.new();

      // Create token
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);

      // Mint some token to loaner
      await loanToken.mint(loaner, initialSupply);
      await loanToken.mint(liquidator, initialSupply);

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
      await protocol.setPriceOracle(
        ETHIdentificationAddress,
        ETHPriceOracle.address,
      );

      // Post prices
      await loanTokenPriceOracle.setPrice(toFixedBN(loanTokenPrice));
      await collateralTokenPriceOracle.setPrice(
        toFixedBN(collateralTokenPrice),
      );
      await ETHPriceOracle.setPrice(toFixedBN(ETHPrice));
    });

    describe('Deposit flow', () => {
      context("When distribution ratio didn't set", () => {
        let depositId;
        let loanId;
        let prevBalanceOfDepositor;

        before(async () => {
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
            // ignore distributor fee ratios setting
            null,
            null,
          );
        });

        it('deposit succeed', async () => {
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

        it("didn't transfer distributor fee after deposit withdrew", async () => {
          prevBalanceOfDepositor = await loanToken.balanceOf(depositor);
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

          const loanRecord = await protocol.getLoanRecordById(loanId);

          await protocol.repayLoan(loanId, loanRecord.remainingDebt, {
            from: loaner,
          });

          const interestRate = await interestModel.getLoanInterestRate(
            loanToken.address,
            loanTerm,
            depositTerms[depositTerms.length - 1],
          );

          const totalInterest = toFixedBN(loanAmount)
            .mul(interestRate)
            .div(toFixedBN(1))
            .mul(new BN(loanTerm))
            .div(new BN(365));

          const depositRecord = await protocol.getDepositRecordById(depositId);

          expect(new BN(depositRecord.interest)).to.bignumber.equal(
            totalInterest.sub(
              totalInterest
                .mul(toFixedBN(protocolReserveRatio))
                .div(toFixedBN(1)),
            ),
          );

          await time.increase(time.duration.days(depositTerm + 1));

          await protocol.withdraw(depositId, { from: depositor });

          const balanceOfDepositor = await loanToken.balanceOf(depositor);

          expect(
            balanceOfDepositor.sub(prevBalanceOfDepositor),
          ).to.bignumber.equal(
            toFixedBN(depositAmount).add(
              totalInterest.sub(
                totalInterest
                  .mul(toFixedBN(protocolReserveRatio))
                  .div(toFixedBN(1)),
              ),
            ),
          );
        });
      });
      context('When distribution ratio changed', () => {
        let earlyWithdrawDepositId;
        let maturedDepositId;
        let loanId;

        let depositDistributorBalanceBeforeEarlyWithdraw;
        let depositDistributorBalanceBeforeWithdraw;
        before(async () => {
          await protocol.setMaxDistributorFeeRatios(
            toFixedBN(maxDepositDistributorFeeRatio),
            toFixedBN(loanDistributorFeeRatio),
          );

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
            depositTerms[1],
            depositDistributor,
            {
              from: depositor,
            },
          );
          maturedDepositId = depositLogs2.filter(
            log => log.event === 'DepositSucceed',
          )[0].args.recordId;

          await protocol.setMaxDistributorFeeRatios(
            toFixedBN(maxDepositDistributorFeeRatio).mul(new BN(2)),
            toFixedBN(loanDistributorFeeRatio).mul(new BN(2)),
          );
        });

        it('early withdraw succeed', async () => {
          depositDistributorBalanceBeforeEarlyWithdraw = await loanToken.balanceOf(
            depositDistributor,
          );

          const { logs: loanLogs } = await protocol.loan(
            loanToken.address,
            collateralToken.address,
            toFixedBN(loanAmount),
            toFixedBN(collateralAmount),
            depositTerm, // loan from the specific term
            loanDistributor,
            {
              from: loaner,
            },
          );
          loanId = loanLogs.filter(log => log.event === 'LoanSucceed')[0].args
            .recordId;

          const loanRecord = await protocol.getLoanRecordById(loanId);

          await protocol.repayLoan(loanId, loanRecord.remainingDebt, {
            from: loaner,
          });

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
        it("didn't transfer token to distributors", async () => {
          const depositDistributorBalance = await loanToken.balanceOf(
            depositDistributor,
          );

          expect(
            depositDistributorBalance.sub(
              depositDistributorBalanceBeforeEarlyWithdraw,
            ),
          ).to.bignumber.equal(toFixedBN(0));
        });
        it('withdraw succeed', async () => {
          const { logs: loanLogs } = await protocol.loan(
            loanToken.address,
            collateralToken.address,
            toFixedBN(loanAmount),
            toFixedBN(collateralAmount),
            depositTerms[1], // loan from the specific term
            loanDistributor,
            {
              from: loaner,
            },
          );
          loanId = loanLogs.filter(log => log.event === 'LoanSucceed')[0].args
            .recordId;

          const loanRecord = await protocol.getLoanRecordById(loanId);

          await protocol.repayLoan(loanId, loanRecord.remainingDebt, {
            from: loaner,
          });

          time.increase(time.duration.days(depositTerm + 1));

          const depositRecord = await protocol.getDepositRecordById(
            maturedDepositId,
          );

          depositDistributorBalanceBeforeWithdraw = await loanToken.balanceOf(
            depositDistributor,
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
            amount: new BN(depositRecord.depositAmount).add(
              new BN(depositRecord.interest),
            ),
          });
        });
        it('transfer correct token to distributors', async () => {
          const interestRate = await interestModel.getLoanInterestRate(
            loanToken.address,
            depositTerms[1],
            maxLoanTerm,
          );

          const totalInterest = toFixedBN(loanAmount)
            .mul(interestRate)
            .div(toFixedBN(1))
            .mul(new BN(depositTerms[1]))
            .div(new BN(365));

          const depositDistributorBalance = await loanToken.balanceOf(
            depositDistributor,
          );

          expect(
            depositDistributorBalance.sub(
              depositDistributorBalanceBeforeWithdraw,
            ),
          ).to.bignumber.equal(
            totalInterest
              .mul(toFixedBN(maxDepositDistributorFeeRatio))
              .div(toFixedBN(1)),
          );
        });
      });
    });
  },
);
