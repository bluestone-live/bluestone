const DepositManager = artifacts.require("./DepositManager.sol")
const enableDepositTerm = require('../../scripts/javascript/enableDepositTerm.js')
const { expect } = require('chai')

describe('script: enableDepositTerm', () => {
  let depositManager
  const cb = () => {}
  const network = 'development'
  const term = 60

  before(async () => {
    depositManager = await DepositManager.deployed()
  })

  contract('DepositManager', () => {
    context('when the term is not enabled', () => {
      it('succeeds', async () => {
        const prevTerms = await depositManager.getDepositTerms()
        await enableDepositTerm(cb, network, term)
        const currTerms = await depositManager.getDepositTerms()
        expect(currTerms.length).to.equal(prevTerms.length + 1)
        expect(currTerms.map(term => term.toNumber())).to.contain(term)
      })
    })

    context('when the term is enabled', () => {
      it('does nothing', async () => {
        const prevTerms = await depositManager.getDepositTerms()
        await enableDepositTerm(cb, network, term)
        const currTerms = await depositManager.getDepositTerms()
        expect(currTerms.length).to.equal(prevTerms.length)
      })
    })
  })
})
