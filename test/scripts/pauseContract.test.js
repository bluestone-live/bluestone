const pauseContract = require('../../scripts/javascript/pauseContract.js')
const { expect } = require('chai')

const cb = () => {}

contract('DepositManager', ([owner]) => {
  describe('script: pauseContract', () => {
    context('when the deposit manager is unpaused', () => {
      it('succeeds', async () => {
        const succeed = await pauseContract(cb, 'DepositManager')
        expect(succeed).to.be.true
      })
    })

    context('when the deposit manager is paused', () => {
      it('fails', async () => {
        const succeed = await pauseContract(cb, 'DepositManager')
        expect(succeed).to.be.false 
      })
    })
  })
})

contract('LoanManager', ([owner]) => {
  describe('script: pauseContract', () => {
    context('when the loan manager is unpaused', () => {
      it('succeeds', async () => {
        const succeed = await pauseContract(cb, 'LoanManager')
        expect(succeed).to.be.true
      })
    })

    context('when the loan manager is paused', () => {
      it('fails', async () => {
        const succeed = await pauseContract(cb, 'LoanManager')
        expect(succeed).to.be.false 
      })
    })
  })
})
