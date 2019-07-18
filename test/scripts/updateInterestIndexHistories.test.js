const deployTokens = require('../../scripts/javascript/deployTokens.js')
const enableDepositAsset = require('../../scripts/javascript/enableDepositAsset.js')
const updateInterestIndexHistories = require('../../scripts/javascript/updateInterestIndexHistories.js')
const { expect } = require('chai')

describe('script: updateInterestIndexHistories', () => {
  const cb = () => {}
  const network = 'development'

  before(async () => {
    await deployTokens(cb, network)
  })

  contract('DepositManager', () => {
    context('when no deposit asset is enabled', () => {
      it('fails', async () => {
        const res = await updateInterestIndexHistories(cb, network)
        expect(res).to.be.false
      })
    })

    context('when deposit assets are enabled', () => {
      before(async () => {
        await enableDepositAsset(cb, network, 'ETH') 
        await enableDepositAsset(cb, network, 'DAI') 
        await enableDepositAsset(cb, network, 'USDT')
      })

      it('succeeds', async () => {
        const res = await updateInterestIndexHistories(cb, network)
        expect(res.length).to.equal(3)
      })
    })
  })
})
