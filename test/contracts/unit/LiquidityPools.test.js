const Configuration = artifacts.require('Configuration')
const LiquidityPools = artifacts.require('LiquidityPoolsMock')
const PoolGroup = artifacts.require('PoolGroup')
const Loan = artifacts.require('Loan')
const { constants, BN } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../../utils/index.js')
const { expect } = require('chai')

contract('LiquidityPools', ([owner, account]) => {
  let config, liquidityPools, loanAsset, collateralAsset

  before(async () => {
    config = await Configuration.deployed()
    loanAsset = await createERC20Token(account)
    collateralAsset = await createERC20Token(account)
  })

  describe('#initPoolGroupIfNeeded', () => {
    const depositTerm = 30
    let pool30Address

    before(async () => {
      liquidityPools = await LiquidityPools.new(config.address)
    })

    context('when pool group is not initialized', () => {
      it('succeeds', async () => {
        await liquidityPools.initPoolGroupIfNeeded(loanAsset.address, depositTerm)
      })

      it('initializes pool group', async () => {
        pool30Address = await liquidityPools.poolGroups(loanAsset.address, depositTerm)

        expect(pool30Address).to.not.equal(constants.ZERO_ADDRESS)
      })
    })

    context('after pool group has already been initialized', () => {
      it('does nothing', async () => {
        await liquidityPools.initPoolGroupIfNeeded(loanAsset.address, depositTerm)

        const updatedPool30Address = await liquidityPools.poolGroups(loanAsset.address, 30)

        expect(updatedPool30Address).to.equal(pool30Address)
      })
    })
  })

  describe('#loanFromPoolGroup', () => {
    const depositTerm = 7
    const loanTerms = [1]
    const loanTerm = 1
    let poolGroup

    beforeEach(async () => {
      liquidityPools = await LiquidityPools.new(config.address)
      await liquidityPools.initPoolGroupIfNeeded(loanAsset.address, depositTerm)

      const poolGroupAddress = await liquidityPools.poolGroups(loanAsset.address, depositTerm)
      poolGroup = await PoolGroup.at(poolGroupAddress)
      const depositAmount = new BN(1)
      
      // Add deposit evently across pools for testing
      for (let i = 0; i < depositTerm; i++) {
        await poolGroup.addDepositToPool(i, depositAmount)
        await poolGroup.addTotalLoanableAmountPerTerm(loanTerm, depositAmount);
      }
    })

    // Test loan sequence in batch
    const loanAmountList = [1, 2, 5, 7]
    const expectedLoanableAmountLists = [
      [0, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ]

    for (let i = 0; i < loanAmountList.length; i++) {
      it(`loans from ${loanAmountList[i]} pool(s) in correct sequence`, async () => {
        const loanAmount = new BN(loanAmountList[i])

        const currLoan = await Loan.new(
          loanAsset.address,
          collateralAsset.address,
          account,
          loanTerm,
          loanAmount,
          loanAmount.mul(new BN(10)),
          toFixedBN(0.1),
          toFixedBN(1.5),
          toFixedBN(0.05)
        )

        await liquidityPools.loanFromPoolGroup(loanAmount, depositTerm, currLoan.address, loanTerms)

        const loanableAmountList = expectedLoanableAmountLists[i]

        for (let i = 0; i < loanableAmountList.length; i++) {
          expect(await poolGroup.getLoanableAmountFromPool(i)).to.bignumber.equal(new BN(loanableAmountList[i]))
        }
      })
    }
  })
})
