const Configuration = artifacts.require('Configuration')
const setShareholderAddress = require('../../scripts/javascript/setShareholderAddress.js')
const { constants } = require('openzeppelin-test-helpers')
const { expect } = require('chai')

contract('Configuration', function([owner, shareholder]) {
  let config
  const cb = () => {}

  before(async () => {
    config = await Configuration.deployed()
  })

  describe('script: setShareholderAddress', () => {
    context('when input is valid', () => {
      it('succeeds', async () => {
        const asset = await setShareholderAddress(cb, shareholder)

        expect(await config.getShareholderAddress()).to.equal(shareholder)
      })
    })

    context('when input is invalid', () => {
      it('fails', async () => {
        const succeed = await setShareholderAddress(cb, constants.ZERO_ADDRESS)

        expect(succeed).to.be.false
      })
    })
  })
})
