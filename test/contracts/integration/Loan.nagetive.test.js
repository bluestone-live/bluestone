const Protocol = artifacts.require('Protocol');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const InterestModel = artifacts.require('InterestModel');
const DateTime = artifacts.require('DateTime');
const { expectRevert } = require('openzeppelin-test-helpers');
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
    const ETHPrice = 2000;

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
      await ETHPriceOracle.setPrice(toFixedBN(ETHPrice));
    });

    describe('Loan token by collateral token flow', () => {
      context("When loan pair didn't enabled", () => {
        before(async () => {
          await protocol.removeLoanAndCollateralTokenPair(
            loanToken.address,
            collateralToken.address,
          );
        });
        it('revert', async () => {
          await expectRevert(
            protocol.loan(
              loanToken.address,
              collateralToken.address,
              toFixedBN(loanAmount),
              toFixedBN(collateralAmount),
              loanTerm,
              loanDistributor,
              {
                from: loaner,
              },
            ),
            'LoanManager: invalid token pair',
          );
        });
      });
      context('When loan pair disabled after loan', () => {
        let loanId;

        before(async () => {
          await protocol.deposit(
            loanToken.address,
            toFixedBN(depositAmount),
            depositTerm,
            depositDistributor,
            {
              from: depositor,
            },
          );
          // reset
          await protocol.setLoanAndCollateralTokenPair(
            loanToken.address,
            collateralToken.address,
            toFixedBN(minCollateralCoverageRatio),
            toFixedBN(liquidationDiscount),
          );

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

          await protocol.removeLoanAndCollateralTokenPair(
            loanToken.address,
            collateralToken.address,
          );
        });

        it('repay succeed', async () => {
          const { remainingDebt } = await protocol.getLoanRecordById(loanId);

          await protocol.repayLoan(loanId, remainingDebt, { from: loaner });

          const {
            remainingDebt: remainingDebtAfterRepaid,
          } = await protocol.getLoanRecordById(loanId);

          expect(remainingDebtAfterRepaid).to.equal('0');
        });

        it('revert loan', async () => {
          await expectRevert(
            protocol.loan(
              loanToken.address,
              collateralToken.address,
              toFixedBN(loanAmount),
              toFixedBN(collateralAmount),
              loanTerm,
              loanDistributor,
              {
                from: loaner,
              },
            ),
            'LoanManager: invalid token pair',
          );
        });
      });
    });

    describe('Loan token by collateral ETH flow', () => {
      context("When loan pair didn't enabled", () => {
        before(async () => {
          await protocol.removeLoanAndCollateralTokenPair(
            loanToken.address,
            ETHIdentificationAddress,
          );
        });
        it('revert', async () => {
          await expectRevert(
            protocol.loan(
              loanToken.address,
              ETHIdentificationAddress,
              toFixedBN(loanAmount),
              '0',
              loanTerm,
              loanDistributor,
              {
                from: loaner,
                value: toFixedBN(collateralAmount),
              },
            ),
            'LoanManager: invalid token pair',
          );
        });
      });
      context('When loan pair disabled after loan', () => {
        let loanId;

        before(async () => {
          await protocol.deposit(
            loanToken.address,
            toFixedBN(depositAmount),
            depositTerm,
            depositDistributor,
            {
              from: depositor,
            },
          );
          // reset
          await protocol.setLoanAndCollateralTokenPair(
            loanToken.address,
            ETHIdentificationAddress,
            toFixedBN(minCollateralCoverageRatio),
            toFixedBN(liquidationDiscount),
          );

          const { logs: loanLogs } = await protocol.loan(
            loanToken.address,
            ETHIdentificationAddress,
            toFixedBN(loanAmount),
            '0',
            loanTerm,
            loanDistributor,
            {
              from: loaner,
              value: toFixedBN(collateralAmount),
            },
          );

          loanId = loanLogs.filter(log => log.event === 'LoanSucceed')[0].args
            .recordId;

          await protocol.removeLoanAndCollateralTokenPair(
            loanToken.address,
            ETHIdentificationAddress,
          );
        });

        it('repay succeed', async () => {
          const { remainingDebt } = await protocol.getLoanRecordById(loanId);

          await protocol.repayLoan(loanId, remainingDebt, { from: loaner });

          const {
            remainingDebt: remainingDebtAfterRepaid,
          } = await protocol.getLoanRecordById(loanId);

          expect(remainingDebtAfterRepaid).to.equal('0');
        });

        it('revert loan', async () => {
          await expectRevert(
            protocol.loan(
              loanToken.address,
              ETHIdentificationAddress,
              toFixedBN(loanAmount),
              toFixedBN(collateralAmount),
              loanTerm,
              loanDistributor,
              {
                from: loaner,
              },
            ),
            'LoanManager: invalid token pair',
          );
        });
      });
    });
  },
);
