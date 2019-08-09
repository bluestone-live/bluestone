const LoanManager = artifacts.require("./LoanManager.sol")
const removeLoanTerm = require('../../scripts/javascript/removeLoanTerm.js')
const { expect } = require('chai')

describe('script: removeLoanTerm', () => {
  let loanManager
  const cb = () => {}
  const network = 'development'
  const term = 60

  before(async () => {
    loanManager = await LoanManager.deployed()
  })

  contract('LoanManager', () => {
    before(async () => {
      await loanManager.addLoanTerm(term)
    })

    context('when the term exists', () => {
      it('succeeds', async () => {
        const prevTerms = await loanManager.getLoanTerms()
        await removeLoanTerm(cb, network, term)
        const currTerms = await loanManager.getLoanTerms()
        expect(currTerms.length).to.equal(prevTerms.length - 1)
        expect(currTerms.map(term => term.toNumber())).to.not.contain(term)
      })
    })

    context('when the term does not exist', () => {
      it('does nothing', async () => {
        const prevTerms = await loanManager.getLoanTerms()
        await removeLoanTerm(cb, network, term)
        const currTerms = await loanManager.getLoanTerms()
        expect(currTerms.length).to.equal(prevTerms.length)
      })
    })
  })
})
