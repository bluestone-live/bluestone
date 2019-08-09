const LoanManager = artifacts.require("./LoanManager.sol")
const addLoanTerm = require('../../scripts/javascript/addLoanTerm.js')
const { expect } = require('chai')

describe('script: addLoanTerm', () => {
  let loanManager
  const cb = () => {}
  const network = 'development'
  const term = 60

  before(async () => {
    loanManager = await LoanManager.deployed()
  })

  contract('LoanManager', () => {
    context('when the term does not exist', () => {
      it('succeeds', async () => {
        const prevTerms = await loanManager.getLoanTerms()
        await addLoanTerm(cb, network, term)
        const currTerms = await loanManager.getLoanTerms()
        expect(currTerms.length).to.equal(prevTerms.length + 1)
        expect(currTerms.map(term => term.toNumber())).to.contain(term)
      })
    })

    context('when the term exists', () => {
      it('does nothing', async () => {
        const prevTerms = await loanManager.getLoanTerms()
        await addLoanTerm(cb, network, term)
        const currTerms = await loanManager.getLoanTerms()
        expect(currTerms.length).to.equal(prevTerms.length)
      })
    })
  })
})
