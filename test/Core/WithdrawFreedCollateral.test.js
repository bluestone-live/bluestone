const Core = artifacts.require('CoreMock')
const { BN, shouldFail } = require('openzeppelin-test-helpers')
const { createERC20Token } = require('../Utils.js')

contract('Core', function([owner, customer]) {
  let core, token
  const initialSupply = 100

  before(async () => {
    core = await Core.new()
    token = await createERC20Token(core.address, initialSupply)
  })

  describe('#withdrawFreedCollateral', () => {
    describe('when amount is 0', () => {
      it('reverts', async () => {
        await shouldFail.reverting(
          core.withdrawFreedCollateral(token.address, 0, { from: customer })
        )
      }) 
    })

    describe('when freed collateral is not enough', () => {
      it('reverts', async () => {
        await shouldFail.reverting(
          core.withdrawFreedCollateral(token.address, 1, { from: customer })
        )
      }) 
    })

    describe('when freed collateral is enough ', () => {
      before(async () => {
        await core.depositFreedCollateral(customer, token.address, initialSupply)       
      })

      it('succeeds', async () => {
        await core.withdrawFreedCollateral(token.address, 100, { from: customer })
        assert.equal((await core.getFreedCollateral(token.address, { from: customer })), 0)
      })
    })
  })
})
