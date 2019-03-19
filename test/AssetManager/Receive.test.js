const ERC20Mock = artifacts.require('ERC20Mock');
const AssetManager = artifacts.require('AssetManagerMock')
const { BN, shouldFail } = require('openzeppelin-test-helpers');

contract('AssetManager', function([_, customer]) {
  const initialSupply = new BN(100);
  let token, assetManager

  beforeEach(async function () {
    // Setup initial balance for customer account
    token = await ERC20Mock.new(customer, initialSupply)
    assetManager = await AssetManager.new()
  })

  describe('receive', () => {
    describe('when the customer has approved protocol to spend its value', () => {
      beforeEach(async () => {
        await token.approve(assetManager.address, initialSupply, { from: customer })
      })

      describe('when the customer has enough balance', () => {
        const amount = initialSupply

        it('receives the requested amount', async () => {
          // Customer send tokens to our protocol
          await assetManager.receive(token.address, customer, amount, { from: customer })

          assert.equal((await token.balanceOf(customer)), 0)
          assert.equal((await token.balanceOf(assetManager.address)), amount.toString())
        })
      })

      describe('when the customer does not have enough balance', () => {
        const amount = initialSupply.addn(1)

        it('reverts', async () => {
          await shouldFail.reverting(
            assetManager.receive(token.address, customer, amount, { from: customer })
          )
        })
      })
    })
  })
})
