const TokenFactory = artifacts.require('./TokenFactory.sol')
const deployTokens = require('../../scripts/javascript/deployTokens.js')
const { constants } = require('openzeppelin-test-helpers')
const { expect } = require('chai')

contract('TokenFactory', ([owner]) => {
  describe('script: deployTokens', () => {
    let tokenFactory

    before(async () => {
      tokenFactory = await TokenFactory.deployed()
    })

    it('deploys ETH, DAI and USDT', async () => {
      const [addrETH, addrDAI, addrUSDT] = await deployTokens()

      expect(await tokenFactory.getToken('ETH')).to.equal(addrETH)
      expect(await tokenFactory.getToken('DAI')).to.equal(addrDAI)
      expect(await tokenFactory.getToken('USDT')).to.equal(addrUSDT)
    })
  })
})
