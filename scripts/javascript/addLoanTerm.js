const LoanManager = artifacts.require('./LoanManager.sol')
const { makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async (_, term) => {
  const loanManager = await LoanManager.deployed()
  await loanManager.addLoanTerm(term)
})
