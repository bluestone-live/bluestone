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
    administrator,
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
    const minCollateralCoverageRatio = 1.5;
    const liquidationDiscount = 0.05;
    const protocolReserveRatio = 0.07;
    const maxDepositDistributorFeeRatio = 0.01;
    const maxLoanDistributorFeeRatio = 0.02;

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
      await loanToken.approve(protocol.address, initialSupply, {
        from: liquidator,
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
          administrator,
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
        maxLoanDistributorFeeRatio,
        [depositor],
        [loaner],
      );

      // Post prices
      await loanTokenPriceOracle.setPrice(toFixedBN(loanTokenPrice));
      await collateralTokenPriceOracle.setPrice(
        toFixedBN(collateralTokenPrice),
      );
      await ETHPriceOracle.setPrice(toFixedBN(ETHPrice));
    });

    describe('Record collateral coverage ratio blow min collateral coverage ratio', () => {
      let loanId;
      const newCollateralTokenPrice = 5;
      let prevCollateralTokenBalanceOfLiquidator;
      let prevLoanTokenBalanceOfLiquidator;
      let prevLoanTokenBalanceOfDistributor;

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
        loanId = loanLogs.filter((log) => log.event === 'LoanSucceed')[0].args
          .recordId;

        await collateralTokenPriceOracle.setPrice(
          toFixedBN(newCollateralTokenPrice),
        );
      });

      it('partially liquidated succeed', async () => {
        const liquidateAmount = toFixedBN(1);
        prevCollateralTokenBalanceOfLiquidator =
          await collateralToken.balanceOf(liquidator);
        prevLoanTokenBalanceOfLiquidator = await loanToken.balanceOf(
          liquidator,
        );
        prevLoanTokenBalanceOfDistributor = await loanToken.balanceOf(
          loanDistributor,
        );

        const { logs: liquidationLogs } = await protocol.liquidateLoan(
          loanId,
          liquidateAmount,
          {
            from: liquidator,
          },
        );

        const collateralTokenBalanceOfLiquidator =
          await collateralToken.balanceOf(liquidator);

        expectEvent.inLogs(liquidationLogs, 'LiquidateLoanSucceed', {
          accountAddress: liquidator,
          recordId: loanId,
          liquidateAmount: liquidateAmount,
        });

        expect(
          collateralTokenBalanceOfLiquidator.sub(
            prevCollateralTokenBalanceOfLiquidator,
          ),
        ).to.bignumber.equal(
          liquidateAmount
            .mul(toFixedBN(loanTokenPrice)) // loan token price
            .div(toFixedBN(newCollateralTokenPrice))
            .mul(toFixedBN(1))
            .div(toFixedBN(1).sub(toFixedBN(liquidationDiscount))),
        );

        const loanTokenBalanceOfLiquidator = await loanToken.balanceOf(
          liquidator,
        );

        expect(
          prevLoanTokenBalanceOfLiquidator.sub(loanTokenBalanceOfLiquidator),
        ).to.bignumber.equal(liquidateAmount);

        const loanTokenBalanceOfDistributor = await loanToken.balanceOf(
          loanDistributor,
        );

        expect(
          loanTokenBalanceOfDistributor.sub(prevLoanTokenBalanceOfDistributor),
        ).to.bignumber.equal(new BN(0));
      });
      it('fully liquidated succeed', async () => {
        const record = await protocol.getLoanRecordById(loanId);
        prevCollateralTokenBalanceOfLiquidator =
          await collateralToken.balanceOf(liquidator);
        prevLoanTokenBalanceOfLiquidator = await loanToken.balanceOf(
          liquidator,
        );
        prevLoanTokenBalanceOfDistributor = await loanToken.balanceOf(
          loanDistributor,
        );

        const { logs: liquidationLogs } = await protocol.liquidateLoan(
          loanId,
          record.remainingDebt,
          {
            from: liquidator,
          },
        );

        const collateralTokenBalanceOfLiquidator =
          await collateralToken.balanceOf(liquidator);

        expectEvent.inLogs(liquidationLogs, 'LiquidateLoanSucceed', {
          accountAddress: liquidator,
          recordId: loanId,
          liquidateAmount: new BN(record.remainingDebt),
        });

        expect(
          collateralTokenBalanceOfLiquidator.sub(
            prevCollateralTokenBalanceOfLiquidator,
          ),
        ).to.bignumber.equal(
          BN.min(
            new BN(record.remainingDebt)
              .mul(toFixedBN(loanTokenPrice))
              .div(toFixedBN(newCollateralTokenPrice))
              .mul(toFixedBN(1))
              .div(toFixedBN(1).sub(toFixedBN(liquidationDiscount))),
            new BN(record.collateralAmount).sub(
              new BN(record.soldCollateralAmount),
            ),
          ),
        );

        const loanTokenBalanceOfLiquidator = await loanToken.balanceOf(
          liquidator,
        );

        expect(
          prevLoanTokenBalanceOfLiquidator.sub(loanTokenBalanceOfLiquidator),
        ).to.bignumber.equal(new BN(record.remainingDebt));

        const loanTokenBalanceOfDistributor = await loanToken.balanceOf(
          loanDistributor,
        );

        expect(
          loanTokenBalanceOfDistributor.sub(prevLoanTokenBalanceOfDistributor),
        ).to.bignumber.equal(
          new BN(record.interest)
            .mul(toFixedBN(maxLoanDistributorFeeRatio))
            .div(toFixedBN(1)),
        );
      });
    });
    describe('Record overdue', () => {
      let loanId;
      let prevCollateralTokenBalanceOfLiquidator;
      let prevLoanTokenBalanceOfLiquidator;
      let prevLoanTokenBalanceOfDistributor;

      before(async () => {
        // reset
        await collateralTokenPriceOracle.setPrice(
          toFixedBN(collateralTokenPrice),
        );

        await protocol.deposit(
          loanToken.address,
          toFixedBN(depositAmount),
          depositTerm,
          depositDistributor,
          { from: depositor },
        );
        const { logs: loanLogs } = await protocol.loan(
          loanToken.address,
          collateralToken.address,
          toFixedBN(loanAmount),
          toFixedBN(collateralAmount),
          loanTerm,
          loanDistributor,
          { from: loaner },
        );
        loanId = loanLogs.filter((log) => log.event === 'LoanSucceed')[0].args
          .recordId;

        await time.increase(time.duration.days(loanTerm + 1));
      });

      it('partially liquidated succeed', async () => {
        const liquidateAmount = toFixedBN(1);
        prevCollateralTokenBalanceOfLiquidator =
          await collateralToken.balanceOf(liquidator);
        prevLoanTokenBalanceOfLiquidator = await loanToken.balanceOf(
          liquidator,
        );
        prevLoanTokenBalanceOfDistributor = await loanToken.balanceOf(
          loanDistributor,
        );

        const { logs: liquidationLogs } = await protocol.liquidateLoan(
          loanId,
          liquidateAmount,
          {
            from: liquidator,
          },
        );

        const collateralTokenBalanceOfLiquidator =
          await collateralToken.balanceOf(liquidator);

        expectEvent.inLogs(liquidationLogs, 'LiquidateLoanSucceed', {
          accountAddress: liquidator,
          recordId: loanId,
          liquidateAmount: liquidateAmount,
        });

        expect(
          collateralTokenBalanceOfLiquidator.sub(
            prevCollateralTokenBalanceOfLiquidator,
          ),
        ).to.bignumber.equal(
          liquidateAmount
            .mul(toFixedBN(loanTokenPrice)) // loan token price
            .div(toFixedBN(collateralTokenPrice))
            .mul(toFixedBN(1))
            .div(toFixedBN(1).sub(toFixedBN(liquidationDiscount))),
        );

        const loanTokenBalanceOfLiquidator = await loanToken.balanceOf(
          liquidator,
        );

        expect(
          prevLoanTokenBalanceOfLiquidator.sub(loanTokenBalanceOfLiquidator),
        ).to.bignumber.equal(liquidateAmount);

        const loanTokenBalanceOfDistributor = await loanToken.balanceOf(
          loanDistributor,
        );

        expect(
          loanTokenBalanceOfDistributor.sub(prevLoanTokenBalanceOfDistributor),
        ).to.bignumber.equal(new BN(0));
      });
      it('fully liquidated succeed', async () => {
        const record = await protocol.getLoanRecordById(loanId);
        prevCollateralTokenBalanceOfLiquidator =
          await collateralToken.balanceOf(liquidator);
        prevLoanTokenBalanceOfLiquidator = await loanToken.balanceOf(
          liquidator,
        );
        prevLoanTokenBalanceOfDistributor = await loanToken.balanceOf(
          loanDistributor,
        );

        const { logs: liquidationLogs } = await protocol.liquidateLoan(
          loanId,
          record.remainingDebt,
          {
            from: liquidator,
          },
        );

        const collateralTokenBalanceOfLiquidator =
          await collateralToken.balanceOf(liquidator);

        expectEvent.inLogs(liquidationLogs, 'LiquidateLoanSucceed', {
          accountAddress: liquidator,
          recordId: loanId,
          liquidateAmount: new BN(record.remainingDebt),
        });

        expect(
          collateralTokenBalanceOfLiquidator.sub(
            prevCollateralTokenBalanceOfLiquidator,
          ),
        ).to.bignumber.equal(
          BN.min(
            new BN(record.remainingDebt)
              .mul(toFixedBN(loanTokenPrice))
              .div(toFixedBN(collateralTokenPrice))
              .mul(toFixedBN(1))
              .div(toFixedBN(1).sub(toFixedBN(liquidationDiscount))),
            new BN(record.collateralAmount).sub(
              new BN(record.soldCollateralAmount),
            ),
          ),
        );

        const loanTokenBalanceOfLiquidator = await loanToken.balanceOf(
          liquidator,
        );

        expect(
          prevLoanTokenBalanceOfLiquidator.sub(loanTokenBalanceOfLiquidator),
        ).to.bignumber.equal(new BN(record.remainingDebt));

        const loanTokenBalanceOfDistributor = await loanToken.balanceOf(
          loanDistributor,
        );

        expect(
          loanTokenBalanceOfDistributor.sub(prevLoanTokenBalanceOfDistributor),
        ).to.bignumber.equal(
          new BN(record.interest)
            .mul(toFixedBN(maxLoanDistributorFeeRatio))
            .div(toFixedBN(1)),
        );
      });
    });
  },
);
