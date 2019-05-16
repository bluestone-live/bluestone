const LoanManager = artifacts.require('LoanManager')
const { shouldFail, constants } = require('openzeppelin-test-helpers')
const { expect } = require('chai')

contract('LoanManager', ([owner, depositor]) => {
  let loanManager

  before(async () => {
    loanManager = await LoanManager.deployed() 
  })

  describe('pause loan manager', () => {
    const asset = constants.ZERO_ADDRESS

    context('when paused', () => {
      before(async () => {
        await loanManager.pause()
      })

      it('reverts on public call', async() => {
        await shouldFail.reverting(
          loanManager.getFreedCollateral(asset, { from: depositor })
        )
      })
    })

    context('when unpaused', () => {
      before(async () => {
        await loanManager.unpause()
      })

      it('succeeds on public call', async() => {
        const amount = await loanManager.getFreedCollateral(asset, { from: depositor })
        expect(amount).to.be.bignumber.equal('0')
      })
    })
  })
})
