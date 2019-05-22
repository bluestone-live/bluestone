const Configuration = artifacts.require('Configuration')
const setProfitRatio = require('../../scripts/javascript/setProfitRatio.js')
const { toFixedBN } = require('../utils/index.js')
const { expect } = require('chai')

contract('Configuration', function([owner]) {
  let config
  const cb = () => {}

  before(async () => {
    config = await Configuration.deployed()
  })

  describe('script: setProfitRatio', () => {
    context('when input is valid', () => {
      it('succeeds', async () => {
        const value = 0.1
        const asset = await setProfitRatio(cb, value)

        expect(await config.getProfitRatio()).to.be.bignumber.equal(toFixedBN(value))
      })
    })

    context('when input is invalid', () => {
      it('fails', async () => {
        const value = 0.31
        const succeed = await setProfitRatio(cb, value)

        expect(succeed).to.be.false
      })
    })
  })
})
