const unpauseContract = require('../../scripts/unpauseContract.js')
const pauseContract = require('../../scripts/pauseContract.js')
const { expect } = require('chai')

const cb = () => {}

contract('DepositManager', ([owner]) => {
  describe('script: unpauseContract', () => {
    context('when the deposit manager is unpaused', () => {
      it('fails', async () => {
        const succeed = await unpauseContract(cb, 'DepositManager')
        expect(succeed).to.be.false
      })
    })

    context('when the deposit manager is paused', () => {
      before(async () => {
        await pauseContract(cb, 'DepositManager')
      })

      it('succeeds', async () => {
        const succeed = await unpauseContract(cb, 'DepositManager')
        expect(succeed).to.be.true 
      })
    })
  })
})

contract('LoanManager', ([owner]) => {
  describe('script: unpauseContract', () => {
    context('when the loan manager is unpaused', () => {
      it('fails', async () => {
        const succeed = await unpauseContract(cb, 'LoanManager')
        expect(succeed).to.be.false
      })
    })

    context('when the loan manager is paused', () => {
      before(async () => {
        await pauseContract(cb, 'LoanManager')
      })

      it('succeeds', async () => {
        const succeed = await unpauseContract(cb, 'LoanManager')
        expect(succeed).to.be.true 
      })
    })
  })
})
