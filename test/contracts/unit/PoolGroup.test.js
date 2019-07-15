const PoolGroup = artifacts.require('PoolGroup')
const { shouldFail, BN } = require('openzeppelin-test-helpers')
const { toFixedBN } = require('../../utils/index.js')
const { expect } = require('chai')

contract('PoolGroup', () => {
  const term = 30
  const poolIndex = 0
  const amount = toFixedBN(100)
  let poolGroup, pool

  describe('#addOneTimeDepositToPool', () => {
    before(async () => {
        poolGroup = await PoolGroup.new(term)
    })

    it('succeeds', async () => {
      await poolGroup.addOneTimeDepositToPool(poolIndex, amount)
      const poolId = await poolGroup.poolIds(poolIndex)
      pool = await poolGroup.poolsById(poolId)
    })

    it('updates oneTimeDeposit', async () => {
      expect(pool.oneTimeDeposit).to.be.bignumber.equal(amount)
    })

    it('does not update recurringDeposit', async () => {
      expect(pool.recurringDeposit).to.be.bignumber.equal('0')
    })

    it('updates totalDeposit', async () => {
      expect(await poolGroup.totalDeposit()).to.be.bignumber.equal(amount)
    })
  })

  describe('#addRecurringDepositToPool', () => {
    before(async () => {
        poolGroup = await PoolGroup.new(term)
    })

    it('succeeds', async () => {
      await poolGroup.addRecurringDepositToPool(poolIndex, amount)
      const poolId = await poolGroup.poolIds(poolIndex)
      pool = await poolGroup.poolsById(poolId)
    })

    it('does not update oneTimeDeposit', async () => {
      expect(pool.oneTimeDeposit).to.be.bignumber.equal('0')
    })

    it('updates recurringDeposit', async () => {
      expect(pool.recurringDeposit).to.be.bignumber.equal(amount)
    })

    it('updates loanableAmount', async () => {
      expect(pool.loanableAmount).to.be.bignumber.equal(amount)
    })

    it('updates totalDeposit', async () => {
      expect(await poolGroup.totalDeposit()).to.be.bignumber.equal(amount)
    })
  })

  describe('#loanFromPool', () => {
    const loanTerm = 1

    before(async () => {
      poolGroup = await PoolGroup.new(term)
      await poolGroup.addOneTimeDepositToPool(poolIndex, amount)
    })

    context('when loanable amount is not enough', () => {
      it('reverts', async () => {
        await shouldFail.reverting(
          poolGroup.loanFromPool(poolIndex, toFixedBN(101), loanTerm)
        )
      })
    })

    it('succeeds', async () => {
      const poolId = await poolGroup.poolIds(poolIndex)
      await poolGroup.loanFromPool(poolIndex, amount, loanTerm)
      pool = await poolGroup.poolsById(poolId)
    })

    it('updates loanableAmount', async () => {
      expect(pool.loanableAmount).to.be.bignumber.equal('0')
    })

    it('updates totalLoan', async () => {
      expect(await poolGroup.totalLoan()).to.be.bignumber.equal(amount)
    })

    it('updates totalLoanPerTerm', async () => {
      expect(await poolGroup.totalLoanPerTerm(loanTerm)).to.be.bignumber.equal(amount)
    })
  })

  describe('#repayLoanToPool', () => {
    const loanTerm = 1

    before(async () => {
      poolGroup = await PoolGroup.new(term)
      await poolGroup.addOneTimeDepositToPool(poolIndex, amount)
      await poolGroup.loanFromPool(poolIndex, amount, loanTerm)
    })

    it('succeeds', async () => {
      const poolId = await poolGroup.poolIds(poolIndex)
      await poolGroup.repayLoanToPool(poolIndex, amount, loanTerm)
      pool = await poolGroup.poolsById(poolId)
    })

    it('updates loanableAmount', async () => {
      expect(pool.loanableAmount).to.be.bignumber.equal(amount)
    })

    it('updates totalRepaid', async () => {
      expect(await poolGroup.totalRepaid()).to.be.bignumber.equal(amount)
    })

    it('updates totalRepaidPerTerm', async () => {
      expect(await poolGroup.totalRepaidPerTerm(loanTerm)).to.be.bignumber.equal(amount)
    })
  })

  describe('#updatePoolIds', () => {
    const initialPoolIndexes = [...Array(term).keys()]

    before(async () => {
      poolGroup = await PoolGroup.new(term)
    })

    it('updates pool ids correctly after one time', async () => {
      await poolGroup.updatePoolIds()

      const updatedPoolIndexes = initialPoolIndexes
        .map(n => n + 1 < term ? n + 1 : 0)
        .map(n => new BN(n))

      for (let i = 0; i < term; i++) {
        expect(await poolGroup.poolIds(i)).to.be.bignumber.equal(updatedPoolIndexes[i])
      }
    })

    it('updates pool ids correctly after 30 times', async () => {
      for (let i = 0; i < term - 1; i++) {
        await poolGroup.updatePoolIds()
      }

      const updatedPoolIndexes = initialPoolIndexes.map(n => new BN(n))

      for (let i = 0; i < term; i++) {
        expect(await poolGroup.poolIds(i)).to.be.bignumber.equal(updatedPoolIndexes[i])
      }
    })
  })

  describe('#withdrawOneTimeDepositFromPool', () => {
    const withdrawAmount = toFixedBN(50)

    before(async () => {
      poolGroup = await PoolGroup.new(term)
      await poolGroup.addOneTimeDepositToPool(poolIndex, amount)
    })

    context('when withdraw amount is more than deposit', () => {
      it('reverts', async () => {
        await shouldFail.reverting(
          poolGroup.withdrawOneTimeDepositFromPool(poolIndex, toFixedBN(101))
        )
      })
    })

    it('succeeds', async () => {
      const poolId = await poolGroup.poolIds(poolIndex)
      await poolGroup.withdrawOneTimeDepositFromPool(poolIndex, withdrawAmount)
      pool = await poolGroup.poolsById(poolId)
    })

    it('updates oneTimeDeposit', async () => {
      expect(pool.oneTimeDeposit).to.be.bignumber.equal(amount.sub(withdrawAmount))
    })

    it('does not update recurringDeposit', async () => {
      expect(pool.recurringDeposit).to.be.bignumber.equal('0')
    })

    it('updates loanableAmount', async () => {
      expect(pool.loanableAmount).to.be.bignumber.equal(amount.sub(withdrawAmount))
    })

    it('updates totalDeposit', async () => {
      expect(await poolGroup.totalDeposit()).to.be.bignumber.equal(amount.sub(withdrawAmount))
    })

    it('does not update totalLoan', async () => {
      expect(await poolGroup.totalLoan()).to.be.bignumber.equal('0')
    })
  })
})
