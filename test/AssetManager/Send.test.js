const AssetManager = artifacts.require('AssetManagerMock')
const { BN, shouldFail } = require('openzeppelin-test-helpers');
const { createERC20Token } = require('../Utils.js')

contract('AssetManager', function([owner, customer]) {
  const initialSupply = new BN(100);
  let token, assetManager

  beforeEach(async function () {
    assetManager = await AssetManager.new()
    // Since the AssetManager address is not deployed on the node,
    // it can't be recognized as a vaid from address, so we need 
    // to set its address to an existing account.
    assetManager.address = owner

    // Setup initial balance for protocol account
    token = await createERC20Token(assetManager.address, initialSupply)
  })

  describe('send', () => {
      describe('when the protocol has enough balance', () => {
        const amount = initialSupply

        it('sends the requested amount to customer', async () => {
          await token.transfer(customer, amount, { from: assetManager.address })

          assert.equal((await token.balanceOf(customer)), amount.toString())
          assert.equal((await token.balanceOf(assetManager.address)), 0)
        })
      })

      describe('when the protocol does not have enough balance', () => {
        const amount = initialSupply.addn(1)

        it('reverts', async () => {
          await shouldFail.reverting(
            assetManager.send(token.address, customer, amount, { from: assetManager.address })
          )
        })
      })
  })
})
