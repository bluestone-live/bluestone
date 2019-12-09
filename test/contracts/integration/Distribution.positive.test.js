const Protocol = artifacts.require('Protocol');
const PriceOracle = artifacts.require('PriceOracle');
const InterestModel = artifacts.require('InterestModel');
const {
  expectRevert,
  expectEvent,
  constants,
  BN,
} = require('openzeppelin-test-helpers');
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
    protocolAddress,
  ]) => {
    let protocol, priceOracle, interestModel, loanToken, collateralToken;
    const initialSupply = toFixedBN(10000);
    const ZERO = toFixedBN(0);

    // configurations
    const depositTerms = [1, 5, 7];
    const maxLoanTerm = 7;
    const minCollateralCoverageRatio = 1.5;
    const liquidationDiscount = 0.05;
    const protocolReserveRatio = 0.07;
    const maxDepositDistributorFeeRatio = 0.01;
    const maxLoanDistributorFeeRatio = 0.02;

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
      protocol = await Protocol.deployed();
      priceOracle = await PriceOracle.deployed();
      interestModel = await InterestModel.deployed();

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

      await setupTestEnv(
        [
          owner,
          depositor,
          loaner,
          depositDistributor,
          loanDistributor,
          protocolAddress,
        ],
        protocol,
        priceOracle,
        interestModel,
        depositTerms,
        [loanToken],
        [loanToken],
        [
          {
            loanTokenAddress: loanToken.address,
            collateralTokenAddress: collateralToken.address,
          },
        ],
        [minCollateralCoverageRatio],
        [liquidationDiscount],
        [maxLoanTerm],
        [loanInterestRateLowerBound],
        [loanInterestRateUpperBound],
        protocolReserveRatio,
        maxDepositDistributorFeeRatio,
        maxLoanDistributorFeeRatio,
      );

      // Post prices
      await priceOracle.setPrices(
        [loanToken.address, collateralToken.address],
        [toFixedBN(loanTokenPrice), toFixedBN(collateralTokenPrice)],
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
          false,
          loanDistributor,
          {
            from: loaner,
          },
        );
        loanId = loanLogs.filter(log => log.event === 'LoanSucceed')[0].args
          .recordId;
      });

      it('returns correct pool data', async () => {
        const {
          poolIdList,
          depositAmountList,
          availableAmountList,
          loanInterestList,
          totalDepositWeightList,
        } = await protocol.getDetailsFromAllPools(loanToken.address);

        for (let i = 0; i < poolIdList.length; i++) {
          const poolId = poolIdList[i];
          const depositAmountInPool = depositAmountList[i];
          const availableAmountInPool = availableAmountList[i];
          const loanInterestInPool = loanInterestList[i];

          if (poolId.toString() === depositTerm.toString()) {
            expect(depositAmountInPool).to.bignumber.equal(
              toFixedBN(depositAmount),
            );
            expect(availableAmountInPool).to.bignumber.equal(
              toFixedBN(depositAmount).sub(toFixedBN(loanAmount)),
            );
            expect(loanInterestInPool).to.bignumber.equal(
              toFixedBN(loanAmount)
                .mul(currentLoanInterestRate)
                .div(toFixedBN(1))
                .mul(new BN(loanTerm))
                .div(new BN(365)),
            );
            totalInterest = loanInterestInPool;
          } else {
            expect(depositAmountInPool).to.bignumber.equal(ZERO);
            expect(availableAmountInPool).to.bignumber.equal(ZERO);
            expect(loanInterestInPool).to.bignumber.equal(ZERO);
          }
        }
      });

      it('returns correct interest for depositor', async () => {
        const interest = await protocol.getDepositInterestById(depositId);

        expect(interest).to.bignumber.equal(
          totalInterest.sub(
            totalInterest
              .mul(
                toFixedBN(
                  protocolReserveRatio +
                    maxDepositDistributorFeeRatio +
                    maxLoanDistributorFeeRatio,
                ),
              )
              .div(toFixedBN(1)),
          ),
        );
      });
      it('transfer distributor fee to loan distributor after loan fully repaid', async () => {
        const prevLoanDistributorBalance = await loanToken.balanceOf(
          loanDistributor,
        );
        const { remainingDebt } = await protocol.getLoanRecordDetailsById(
          loanId,
        );

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
            .mul(toFixedBN(maxLoanDistributorFeeRatio))
            .div(toFixedBN(1)),
        );
      });
      it('returns correct pool data after update deposit maturity');
      it('transfer correct amount to depositor after withdraw deposit');
      it('transfer distributor fee to deposit distributor');
      it('transfer reserve fee to protocol address');
      it('returns correct balance from protocol contract');
    });

    describe('Early withdraw deposit flow', () => {
      let depositId;
      let loanId;

      beforeEach(async () => {
        // Create deposit record
        depositId = await protocol.deposit(
          loanToken.address,
          depositAmount,
          depositTerm,
          depositDistributor,
          {
            from: depositor,
          },
        );

        // Create loan record
        loanId = await protocol.loan(
          loanToken.address,
          collateralToken.address,
          loanAmount,
          collateralAmount,
          loanTerm,
          false,
          loanDistributor,
          {
            from: loaner,
          },
        );
      });
      it('returns correct pool data after update deposit maturity');
      it('transfer correct amount to depositor after withdraw deposit');
      it('transfer distributor fee to deposit distributor');
      it('transfer reserve fee to protocol address');
      it('returns correct balance from protocol contract');
    });
  },
);
