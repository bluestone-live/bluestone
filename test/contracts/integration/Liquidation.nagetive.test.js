const Protocol = artifacts.require('Protocol');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const InterestRateModel = artifacts.require('LinearInterestRateModel');
const DateTime = artifacts.require('DateTime');
const { expectRevert, BN } = require('@openzeppelin/test-helpers');
const {
  toFixedBN,
  createERC20Token,
  ETHIdentificationAddress,
} = require('../../utils/index');
const { setupTestEnv } = require('../../utils/setupTestEnv');
const { expect } = require('chai');

contract(
  'Protocol: Liquidation(nagetive)',
  ([
    owner,
    keeper,
    depositor,
    loaner,
    depositDistributor,
    loanDistributor,
    protocolReserveAddress,
  ]) => {
    let protocol, interestRateModel, loanToken, collateralToken;

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
      interestRateModel = await InterestRateModel.new();
      loanTokenPriceOracle = await SingleFeedPriceOracle.new();
      collateralTokenPriceOracle = await SingleFeedPriceOracle.new();
      ETHPriceOracle = await SingleFeedPriceOracle.new();
      datetime = await DateTime.new();

      // Create token
      loanToken = await createERC20Token(depositor, initialSupply);
      collateralToken = await createERC20Token(loaner, initialSupply);

      // Mint some token to loaner
      await loanToken.mint(loaner, initialSupply);
      await loanToken.mint(keeper, initialSupply);

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
        from: keeper,
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
          keeper,
          depositor,
          loaner,
          depositDistributor,
          loanDistributor,
          protocolReserveAddress,
        ],
        protocol,
        interestRateModel,
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
        [keeper],
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

    describe('Liquidate a safety record', () => {
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
      });

      it('revert', async () => {
        const record = await protocol.getLoanRecordById(loanId);

        expect(new BN(record.collateralCoverageRatio)).to.bignumber.gt(
          new BN(record.minCollateralCoverageRatio),
        );

        await expectRevert(
          protocol.liquidateLoan(loanId, record.remainingDebt, {
            from: keeper,
          }),
          'LoanManager: not liquidatable',
        );
      });
    });
    describe('Liquidate a closed record', () => {
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

        const record = await protocol.getLoanRecordById(loanId);

        await protocol.repayLoan(loanId, record.remainingDebt, {
          from: loaner,
        });
      });

      it('revert', async () => {
        const record = await protocol.getLoanRecordById(loanId);

        expect(record.isClosed).to.be.true;

        await expectRevert(
          protocol.liquidateLoan(loanId, record.remainingDebt, {
            from: keeper,
          }),
          'LoanManager: loan already closed',
        );
      });
    });
  },
);
