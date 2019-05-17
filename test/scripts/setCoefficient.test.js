const Configuration = artifacts.require('Configuration')
const setCoefficient = require('../../scripts/javascript/setCoefficient.js')
const { toFixedBN } = require('../utils/index.js')
const { expect } = require('chai')

contract('Configuration', function([owner]) {
  let config
  const cb = () => {}

  before(async () => {
    config = await Configuration.deployed()
  })

  describe('script: setCoefficient', () => {
    context('when input is valid', () => {
      it('succeeds', async () => {
        const depositTerm = 30
        const loanTerm = 1
        const value = 0.5
        const succeed = await setCoefficient(cb, depositTerm, loanTerm, value)

        expect(succeed).to.be.true
        expect(await config.getCoefficient(depositTerm, loanTerm)).to.be.bignumber.equal(toFixedBN(value))
      })
    })

    context('when value is more than 1', () => {
      it('fails', async () => {
        const depositTerm = 30
        const loanTerm = 1
        const value = 1.1
        const succeed = await setCoefficient(cb, depositTerm, loanTerm, value)

        expect(succeed).to.be.false
      })
    })

    context('when term is invalid', () => {
      it('fails', async () => {
        const depositTerm = 3
        const loanTerm = 1
        const value = 0.5
        const succeed = await setCoefficient(cb, depositTerm, loanTerm, value)

        expect(succeed).to.be.false
      })
    })
  })
})
