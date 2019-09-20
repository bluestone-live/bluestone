const Configuration = artifacts.require('Configuration');
const LiquidityPools = artifacts.require('LiquidityPoolsMock');
const PoolGroup = artifacts.require('PoolGroup');
const Deposit = artifacts.require('Deposit');
const Loan = artifacts.require('Loan');
const { constants, BN } = require('openzeppelin-test-helpers');
const { createERC20Token, toFixedBN } = require('../../utils/index.js');
const { expect } = require('chai');

contract('LiquidityPools', ([owner, account]) => {
  let liquidityPools, loanAsset, collateralAsset, deposit, poolGroup, pool;
  const depositTerm = 30;
  const amount = toFixedBN(100);
  const protocolReserveRatio = toFixedBN(0.1);
  const loanAmount = toFixedBN(50);
  const collateralAmount = toFixedBN(300);
  const loanTerms = [7, 30];

  before(async () => {
    config = await Configuration.deployed();
    liquidityPools = await LiquidityPools.deployed();
    loanAsset = await createERC20Token(account);
    collateralAsset = await createERC20Token(account);
  });

  describe('#initPoolGroupIfNeeded', () => {
    let pool30Address;

    context('when pool group is not initialized', () => {
      before(async () => {});

      it('succeeds', async () => {
        await liquidityPools.initPoolGroupIfNeeded(
          loanAsset.address,
          depositTerm,
        );
      });

      it('initializes pool group', async () => {
        pool30Address = await liquidityPools.poolGroups(
          loanAsset.address,
          depositTerm,
        );

        expect(pool30Address).to.not.equal(constants.ZERO_ADDRESS);
      });
    });
    context('after pool group has already been initialized', () => {
      it('does nothing', async () => {
        await liquidityPools.initPoolGroupIfNeeded(
          loanAsset.address,
          depositTerm,
        );

        const updatedPool30Address = await liquidityPools.poolGroups(
          loanAsset.address,
          30,
        );

        expect(updatedPool30Address).to.equal(pool30Address);
      });
    });
  });

  describe('#addDepositToPoolGroup', () => {
    before(async () => {
      const poolGroupAddress = await liquidityPools.poolGroups(
        loanAsset.address,
        depositTerm,
      );
      poolGroup = await PoolGroup.at(poolGroupAddress);
      const poolId = await poolGroup.poolIds(depositTerm - 1);
      pool = await poolGroup.poolsById(poolId);
      deposit = await Deposit.new(
        loanAsset.address,
        owner,
        depositTerm,
        amount,
        protocolReserveRatio,
        poolId,
      );
    });

    it('succeed', async () => {
      await liquidityPools.addDepositToPoolGroup(deposit.address, [7, 30]);
    });

    it("increase pool-group's totalLoanableAmount", async () => {
      expect(await poolGroup.totalLoanableAmount()).to.bignumber.equal(amount);
    });

    it("increase pool's deposit and loanable amount", async () => {
      const poolId = await poolGroup.poolIds(depositTerm - 1);
      pool = await poolGroup.poolsById(poolId);
      expect(pool.deposit).to.bignumber.equal(amount);
      expect(pool.loanableAmount).to.bignumber.equal(amount);
    });
  });

  describe('#subDepositFromPoolGroup', () => {
    before(async () => {
      const poolGroupAddress = await liquidityPools.poolGroups(
        loanAsset.address,
        depositTerm,
      );
      poolGroup = await PoolGroup.at(poolGroupAddress);
      const poolId = await poolGroup.poolIds(depositTerm - 1);
      pool = await poolGroup.poolsById(poolId);
      deposit = await Deposit.new(
        loanAsset.address,
        owner,
        depositTerm,
        amount,
        protocolReserveRatio,
        poolId,
      );
    });

    it('succeed to add deposit', async () => {
      await liquidityPools.addDepositToPoolGroup(deposit.address, loanTerms);
      expect(await poolGroup.totalDeposit()).to.bignumber.equal(
        amount.mul(new BN(2)),
      );
    });

    it('succeed to sub deposit', async () => {
      await liquidityPools.subDepositFromPoolGroup(deposit.address, loanTerms);
      expect(await poolGroup.totalDeposit()).to.bignumber.equal(amount);
      expect(await poolGroup.totalLoanableAmount()).to.bignumber.equal(amount);
    });

    it("updates pool's deposit and loanable amount", async () => {
      const poolId = await poolGroup.poolIds(depositTerm - 1);
      pool = await poolGroup.poolsById(poolId);
      expect(pool.deposit).to.bignumber.equal(amount);
      expect(pool.loanableAmount).to.bignumber.equal(amount);
    });
  });

  describe('#loanFromPoolGroup', () => {
    const depositTerm = 7;
    const loanTerms = [1];
    const loanTerm = 1;
    const interestRate = toFixedBN(0.15);
    let poolGroup;

    beforeEach(async () => {
      liquidityPools = await LiquidityPools.new(config.address);
      await liquidityPools.initPoolGroupIfNeeded(
        loanAsset.address,
        depositTerm,
      );

      const poolGroupAddress = await liquidityPools.poolGroups(
        loanAsset.address,
        depositTerm,
      );
      poolGroup = await PoolGroup.at(poolGroupAddress);
      const depositAmount = toFixedBN(1);

      // Add deposit evently across pools for testing
      for (let i = 0; i < depositTerm; i++) {
        await poolGroup.addDepositToPool(i, depositAmount);
        await poolGroup.addTotalLoanableAmountPerTerm(loanTerm, depositAmount);
      }
    });

    // Test loan sequence in batch
    const loanAmountList = [1, 2, 5, 7];
    const expectedLoanableAmountLists = [
      [0, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ];

    for (let i = 0; i < loanAmountList.length; i++) {
      it(`loans from ${loanAmountList[i]} pool(s) in correct sequence`, async () => {
        const loanAmount = toFixedBN(loanAmountList[i]);

        const currLoan = await Loan.new(
          loanAsset.address,
          collateralAsset.address,
          account,
          loanTerm,
          loanAmount,
          loanAmount.mul(new BN(10)),
          interestRate,
          toFixedBN(1.5),
          toFixedBN(0.05),
        );

        await liquidityPools.loanFromPoolGroup(
          loanAmount,
          depositTerm,
          currLoan.address,
          loanTerms,
        );

        const loanableAmountList = expectedLoanableAmountLists[i];

        const loanInterest = await currLoan.interest();

        for (let j = 0; j < loanableAmountList.length; j++) {
          const loanableAmount = loanableAmountList[j];
          const poolId = await poolGroup.poolIds(j);
          const pool = await poolGroup.poolsById(poolId);

          const interest = pool.loanableAmount.eq(toFixedBN(0))
            ? loanInterest.mul(toFixedBN(1)).div(loanAmount)
            : toFixedBN(0);

          expect(
            await poolGroup.getLoanableAmountFromPool(j),
          ).to.bignumber.equal(toFixedBN(loanableAmountList[j]));
          expect(pool.loanInterest).to.bignumber.equal(interest);
        }
      });
    }
  });
});
