const Configuration = artifacts.require('Configuration')
const { shouldFail } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../../utils/index.js')
const { expect } = require('chai')

contract('Configuration', function([owner, anotherAccount]) {
  let config

  before(async () => {
    config = await Configuration.deployed()
  })

  describe('#setCoefficient', () => {
    const depositTerm = 7
    const loanTerm = 1
    const value = toFixedBN(0.5)

    it('succeeds', async () => {
      await config.setCoefficient(depositTerm, loanTerm, value, { from: owner })
      expect(await config.getCoefficient(depositTerm, loanTerm)).to.be.bignumber.equal(value)
    })
  })

  describe('#setLoanInterestRate', () => {
    const loanTerm = 1
    const value = toFixedBN(0.05)

    it('succeeds', async () => {
      await config.setLoanInterestRate(loanTerm, value, { from: owner })
      expect(await config.getLoanInterestRate(loanTerm)).to.be.bignumber.equal(value)
    })
  })

  describe('#setRiskParameters', () => {
    let loanAsset, collateralAsset

    before(async () => {
      loanAsset = await createERC20Token(owner)
      collateralAsset = await createERC20Token(owner)
    }) 

    context('when collateral ratio is valid', () => {
      const collateralRatio = toFixedBN(1.5)
      const liquidationDiscount = toFixedBN(0.03)

      it('succeeds', async () => {
        await config.setRiskParameters(
          loanAsset.address, 
          collateralAsset.address, 
          collateralRatio,
          liquidationDiscount, 
          { from: owner }
        )

        const res = await config.getRiskParameters(loanAsset.address, collateralAsset.address)
        expect(res['0']).to.be.bignumber.equal(collateralRatio)
        expect(res['1']).to.be.bignumber.equal(liquidationDiscount)
      })
    })

    context('when collateral ratio is invalid', () => {
      const collateralRatio = toFixedBN(1.1)
      const liquidationDiscount = toFixedBN(0.03)

      it('reverts', async () => {
        await shouldFail.reverting(
          config.setRiskParameters(
            loanAsset.address, 
            collateralAsset.address, 
            collateralRatio,
            liquidationDiscount, 
            { from: owner }
          )
        )
      })
    })

    context('when liquidation discount is invalid', () => {
      const collateralRatio = toFixedBN(1.5)
      const liquidationDiscount = toFixedBN(0.06)

      it('reverts', async () => {
        await shouldFail.reverting(
          config.setRiskParameters(
            loanAsset.address, 
            collateralAsset.address, 
            collateralRatio,
            liquidationDiscount, 
            { from: owner }
          )
        )
      })
    })
  })
})
