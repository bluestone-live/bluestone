const Configuration = artifacts.require('Configuration')
const setProtocolAddress = require('../../scripts/javascript/setProtocolAddress.js')
const { constants } = require('openzeppelin-test-helpers')
const { expect } = require('chai')


describe('script: setProtocolAddress', () => {
  let config
  const cb = () => {}
  const network = 'development'

  before(async () => {
    config = await Configuration.deployed()
  })

  contract('Configuration', function([_, protocol]) {
    context('when input is valid', () => {
      it('succeeds', async () => {
        await setProtocolAddress(cb, network, protocol)

        expect(await config.getProtocolAddress()).to.equal(protocol)
      })
    })

    context('when input is invalid', () => {
      it('fails', async () => {
        const succeed = await setProtocolAddress(cb, network, constants.ZERO_ADDRESS)

        expect(succeed).to.be.false
      })
    })
  })
})
