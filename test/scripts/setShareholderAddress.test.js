const Configuration = artifacts.require('Configuration')
const setShareholderAddress = require('../../scripts/javascript/setShareholderAddress.js')
const { constants } = require('openzeppelin-test-helpers')
const { expect } = require('chai')


describe('script: setShareholderAddress', () => {
  let config
  const cb = () => {}
  const network = 'development'

  before(async () => {
    config = await Configuration.deployed()
  })

  contract('Configuration', function([owner, shareholder]) {
    context('when input is valid', () => {
      it('succeeds', async () => {
        const asset = await setShareholderAddress(cb, network, shareholder)

        expect(await config.getShareholderAddress()).to.equal(shareholder)
      })
    })

    context('when input is invalid', () => {
      it('fails', async () => {
        const succeed = await setShareholderAddress(cb, network, constants.ZERO_ADDRESS)

        expect(succeed).to.be.false
      })
    })
  })
})
