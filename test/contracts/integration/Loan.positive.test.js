const Protocol = artifacts.require('Protocol');
const PayableProxy = artifacts.require('PayableProxy');
const SingleFeedPriceOracle = artifacts.require('SingleFeedPriceOracle');
const WETH = artifacts.require('WETH9');
const InterestModel = artifacts.require('InterestModel');
const DateTime = artifacts.require('DateTime');
const {
  expectRevert,
  expectEvent,
  BN,
  time,
} = require('openzeppelin-test-helpers');
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
    let protocol,
      interestModel,
      payableProxy,
      loanToken,
      collateralToken,
      weth,
      datetime;

    const initialSupply = toFixedBN(10000);
    const ZERO = toFixedBN(0);

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

    let currentLoanInterestRate;

    // Token prices
    const loanTokenPrice = 1;
    const collateralTokenPrice = 100;
    const ETHPrice = 2000;

    // deposit parameters
    const depositAmount = 100;
    const depositTerm = 7;

    // loan parameters
    const loanAmount = 150;
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
      weth = await WETH.new();

      payableProxy = await PayableProxy.new(protocol.address, weth.address);

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

      // Set payable proxy
      await protocol.setPayableProxy(payableProxy.address);

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
      let loanId;
      let prevCollateralTokenBalanceOfProtocol;

      before(async () => {
        // deposit in different terms
        await protocol.deposit(
          loanToken.address,
          toFixedBN(depositAmount),
          depositTerms[1],
          depositDistributor,
          {
            from: depositor,
          },
        );
        await protocol.deposit(
          loanToken.address,
          toFixedBN(depositAmount),
          depositTerms[2],
          depositDistributor,
          {
            from: depositor,
          },
        );

        prevCollateralTokenBalanceOfProtocol = await collateralToken.balanceOf(
          protocol.address,
        );
      });

      context('Repaid in time', () => {
        let prevLoanTokenBalanceOfLoaner;
        let prevCollateralTokenBalanceOfLoaner;
        let prevLoanTokenBalanceOfProtocol;

        before(async () => {
          prevLoanTokenBalanceOfProtocol = await loanToken.balanceOf(
            protocol.address,
          );
        });

        it('succeed', async () => {
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

          prevLoanTokenBalanceOfLoaner = await loanToken.balanceOf(loaner);
          prevCollateralTokenBalanceOfLoaner = await collateralToken.balanceOf(
            loaner,
          );

          expectEvent.inLogs(loanLogs, 'LoanSucceed', {
            accountAddress: loaner,
            recordId: loanId,
            amount: toFixedBN(loanAmount),
          });
        });
        it('increase the collateral token amount of protocol contract', async () => {
          const collateralTokenBalanceOfProtocol = await collateralToken.balanceOf(
            protocol.address,
          );

          expect(
            new BN(collateralTokenBalanceOfProtocol).sub(
              new BN(prevCollateralTokenBalanceOfProtocol),
            ),
          ).to.bignumber.equal(toFixedBN(collateralAmount));
        });
        it('modify amount of specific pools', async () => {
          const currentPoolId = await datetime.toDays();
          const pools = await protocol.getPoolsByToken(loanToken.address);
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

          const firstPool = pools.find(
            pool =>
              pool.poolId ===
              (Number.parseInt(currentPoolId, 10) + depositTerms[1]).toString(),
          );

          const secondPool = pools.find(
            pool =>
              pool.poolId ===
              (Number.parseInt(currentPoolId, 10) + depositTerms[2]).toString(),
          );

          expect(new BN(firstPool.depositAmount)).to.bignumber.equal(
            toFixedBN(depositAmount),
          );
          expect(new BN(firstPool.availableAmount)).to.bignumber.equal(
            toFixedBN(0),
          );

          expect(new BN(firstPool.loanInterest)).to.bignumber.equal(
            totalInterest
              .mul(
                new BN(firstPool.depositAmount).sub(
                  new BN(firstPool.availableAmount),
                ),
              )
              .div(toFixedBN(loanAmount)),
          );
          expect(new BN(secondPool.depositAmount)).to.bignumber.equal(
            toFixedBN(depositAmount),
          );
          expect(new BN(secondPool.availableAmount)).to.bignumber.equal(
            toFixedBN(depositAmount * 2 - loanAmount),
          );
          expect(new BN(secondPool.loanInterest)).to.bignumber.equal(
            totalInterest
              .mul(
                new BN(secondPool.depositAmount).sub(
                  new BN(secondPool.availableAmount),
                ),
              )
              .div(toFixedBN(loanAmount)),
          );
        });
        it('create a new record for user account', async () => {
          const records = await protocol.getLoanRecordsByAccount(loaner);

          expect(records.length).to.equal(1);
          expect(records[0].loanId).to.equal(loanId);
        });
        it('get correct data of record', async () => {
          const record = await protocol.getLoanRecordById(loanId);

          const currentCollateralRatio = toFixedBN(collateralAmount)
            .sub(new BN(record.soldCollateralAmount))
            .mul(toFixedBN(collateralTokenPrice))
            .div(new BN(record.remainingDebt))
            .mul(toFixedBN(1))
            .div(toFixedBN(loanTokenPrice));

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

          const remainingDebt = totalInterest.add(toFixedBN(loanAmount));

          expect(record.loanTokenAddress).to.equal(loanToken.address);
          expect(record.collateralTokenAddress).to.equal(
            collateralToken.address,
          );
          expect(new BN(record.loanAmount)).to.bignumber.equal(
            toFixedBN(loanAmount),
          );
          expect(new BN(record.collateralAmount)).to.bignumber.equal(
            toFixedBN(collateralAmount),
          );
          expect(new BN(record.currentCollateralRatio)).to.bignumber.equal(
            currentCollateralRatio,
          );
          expect(new BN(record.alreadyPaidAmount)).to.bignumber.equal(
            toFixedBN(0),
          );
          expect(new BN(record.soldCollateralAmount)).to.bignumber.equal(
            toFixedBN(0),
          );
          expect(new BN(record.remainingDebt)).to.bignumber.equal(
            remainingDebt,
          );
        });
        it('add collateral succeed', async () => {
          const { logs: addCollateralLogs } = await protocol.addCollateral(
            loanId,
            toFixedBN(collateralAmount),
            { from: loaner },
          );

          expectEvent.inLogs(addCollateralLogs, 'AddCollateralSucceed', {
            accountAddress: loaner,
            recordId: loanId,
            collateralAmount: toFixedBN(collateralAmount),
          });
        });
        it('get correct data of record', async () => {
          const record = await protocol.getLoanRecordById(loanId);

          const currentCollateralRatio = toFixedBN(collateralAmount)
            .add(toFixedBN(collateralAmount))
            .sub(new BN(record.soldCollateralAmount))
            .mul(toFixedBN(collateralTokenPrice))
            .div(new BN(record.remainingDebt))
            .mul(toFixedBN(1))
            .div(toFixedBN(loanTokenPrice));

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

          const remainingDebt = totalInterest.add(toFixedBN(loanAmount));

          expect(record.loanTokenAddress).to.equal(loanToken.address);
          expect(record.collateralTokenAddress).to.equal(
            collateralToken.address,
          );
          expect(new BN(record.loanAmount)).to.bignumber.equal(
            toFixedBN(loanAmount),
          );
          expect(new BN(record.collateralAmount)).to.bignumber.equal(
            toFixedBN(collateralAmount).add(toFixedBN(collateralAmount)),
          );
          expect(new BN(record.currentCollateralRatio)).to.bignumber.equal(
            currentCollateralRatio,
          );
          expect(new BN(record.alreadyPaidAmount)).to.bignumber.equal(
            toFixedBN(0),
          );
          expect(new BN(record.soldCollateralAmount)).to.bignumber.equal(
            toFixedBN(0),
          );
          expect(new BN(record.remainingDebt)).to.bignumber.equal(
            remainingDebt,
          );
        });
        it('partially repaid succeed', async () => {
          const { logs: repayLogs } = await protocol.repayLoan(
            loanId,
            toFixedBN(loanAmount),
            { from: loaner },
          );

          expectEvent.inLogs(repayLogs, 'RepayLoanSucceed', {
            accountAddress: loaner,
            recordId: loanId,
            amount: toFixedBN(loanAmount),
          });
        });
        it('get correct data of record', async () => {
          const record = await protocol.getLoanRecordById(loanId);

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

          const remainingDebt = totalInterest;

          const currentCollateralRatio = toFixedBN(collateralAmount)
            .add(toFixedBN(collateralAmount))
            .sub(new BN(record.soldCollateralAmount))
            .mul(toFixedBN(collateralTokenPrice))
            .div(new BN(remainingDebt))
            .mul(toFixedBN(1))
            .div(toFixedBN(loanTokenPrice));

          expect(record.loanTokenAddress).to.equal(loanToken.address);
          expect(record.collateralTokenAddress).to.equal(
            collateralToken.address,
          );
          expect(new BN(record.loanAmount)).to.bignumber.equal(
            toFixedBN(loanAmount),
          );
          expect(new BN(record.collateralAmount)).to.bignumber.equal(
            toFixedBN(collateralAmount).add(toFixedBN(collateralAmount)),
          );
          expect(new BN(record.currentCollateralRatio)).to.bignumber.equal(
            currentCollateralRatio,
          );
          expect(new BN(record.alreadyPaidAmount)).to.bignumber.equal(
            toFixedBN(loanAmount),
          );
          expect(new BN(record.soldCollateralAmount)).to.bignumber.equal(
            toFixedBN(0),
          );
          expect(new BN(record.remainingDebt)).to.bignumber.equal(
            totalInterest,
          );
        });
        it('fully repaid succeed', async () => {
          const record = await protocol.getLoanRecordById(loanId);

          const { logs: repayLogs } = await protocol.repayLoan(
            loanId,
            new BN(record.remainingDebt),
            { from: loaner },
          );

          expectEvent.inLogs(repayLogs, 'RepayLoanSucceed', {
            accountAddress: loaner,
            recordId: loanId,
            amount: new BN(record.remainingDebt),
          });
        });
        it('subtract correct balance from user account', async () => {
          const collateralTokenBalanceOfLoaner = await collateralToken.balanceOf(
            loaner,
          );

          expect(
            collateralTokenBalanceOfLoaner.sub(
              prevCollateralTokenBalanceOfLoaner,
            ),
          ).to.bignumber.equal(toFixedBN(collateralAmount));
        });
        it('transfer correct amount to user account', async () => {
          const record = await protocol.getLoanRecordById(loanId);

          const loanTokenBalanceOfLoaner = await loanToken.balanceOf(loaner);

          expect(
            prevLoanTokenBalanceOfLoaner.sub(loanTokenBalanceOfLoaner),
          ).to.bignumber.equal(
            new BN(record.loanAmount).add(new BN(record.interest)),
          );
        });
        it('closed the record', async () => {
          const record = await protocol.getLoanRecordById(loanId);

          expect(record.isClosed).to.be.true;
        });
        it('increase the loan token amount of protocol contract', async () => {
          const { interest } = await protocol.getLoanRecordById(loanId);
          const loanTokenBalanceOfProtocol = await loanToken.balanceOf(
            protocol.address,
          );
          const totalInterest = new BN(interest);

          expect(
            loanTokenBalanceOfProtocol
              .sub(prevLoanTokenBalanceOfProtocol)
              .sub(new BN(1)), // Notice: There are some differences in precision calculating between js BN library and solidity, so I need to subtract 1 in js
          ).to.bignumber.equal(
            totalInterest.sub(
              totalInterest
                .mul(toFixedBN(loanDistributorFeeRatio))
                .div(toFixedBN(1)),
            ),
          );
        });
      });
    });
  },
);
