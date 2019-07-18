const Configuration = artifacts.require('Configuration')
const setProfitRatio = require('../../scripts/javascript/setProfitRatio.js')
const { toFixedBN } = require('../utils/index.js')
const { expect } = require('chai')

describe('script: setProfitRatio', () => {
  let config
  const cb = () => {}
  const network = 'development'

  before(async () => {
    config = await Configuration.deployed()
  })

  contract('Configuration', () => {
    context('when input is valid', () => {
      it('succeeds', async () => {
        const value = 0.1
        await setProfitRatio(cb, network, value)

        expect(await config.getProfitRatio()).to.be.bignumber.equal(toFixedBN(value))
      })
    })

    context('when input is invalid', () => {
      it('fails', async () => {
        const value = 0.31
        const succeed = await setProfitRatio(cb, network, value)

        expect(succeed).to.be.false
      })
    })
  })
})
