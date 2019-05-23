const Configuration = artifacts.require('Configuration')
const setCoefficient = require('../../scripts/javascript/setCoefficient.js')
const deployTokens = require('../../scripts/javascript/deployTokens.js')
const { toFixedBN } = require('../utils/index.js')
const { expect } = require('chai')

contract('Configuration', function([owner]) {
  let config
  const cb = () => {}
  const tokenSymbol = 'ETH'

  before(async () => {
    config = await Configuration.deployed()
    await deployTokens()
  })

  describe('script: setCoefficient', () => {
    context('when input is valid', () => {
      it('succeeds', async () => {
        const depositTerm = 30
        const loanTerm = 1
        const value = 0.5
        const tokenAddress = await setCoefficient(cb, tokenSymbol, depositTerm, loanTerm, value)

        expect(await config.getCoefficient(tokenAddress, depositTerm, loanTerm)).to.be.bignumber.equal(toFixedBN(value))
      })
    })

    context('when value is more than 1', () => {
      it('fails', async () => {
        const depositTerm = 30
        const loanTerm = 1
        const value = 1.1
        const succeed = await setCoefficient(cb, tokenSymbol, depositTerm, loanTerm, value)

        expect(succeed).to.be.false
      })
    })

    context('when term is invalid', () => {
      it('fails', async () => {
        const depositTerm = 3
        const loanTerm = 1
        const value = 0.5
        const succeed = await setCoefficient(cb, tokenSymbol, depositTerm, loanTerm, value)

        expect(succeed).to.be.false
      })
    })
  })
})
