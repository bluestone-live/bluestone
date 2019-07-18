const deployTokens = require('../../scripts/javascript/deployTokens.js')
const { expect } = require('chai')
const { loadNetworkConfig } = require('../../scripts/javascript/utils.js')

describe('script: deployTokens', () => {
  it('deploys ETH, DAI and USDT', async () => {
    const cb = () => {}
    const network = 'development'
    const tokens = await deployTokens(cb, network)
    const networkConfig = loadNetworkConfig()[network]

    expect(networkConfig.tokens.ETH.address).to.equal(tokens.ETH.address)
    expect(networkConfig.tokens.DAI.address).to.equal(tokens.DAI.address)
    expect(networkConfig.tokens.USDT.address).to.equal(tokens.USDT.address)
  })
})
