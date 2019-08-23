const TokenManager = artifacts.require('TokenManager')
const DepositManager = artifacts.require('DepositManagerMock')
const { expectRevert } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../../utils/index.js')

contract('DepositManager', ([owner, depositor]) => {
  let depositManager, tokenManager

  before(async () => {
    depositManager = await DepositManager.deployed() 
    tokenManager = await TokenManager.deployed()
  })

  describe('deposit flow negative #2', () => {
    const initialSupply = toFixedBN(100)
    let term, asset

    before(async () => {
      term = (await depositManager.getDepositTerms())[0]
      asset = await createERC20Token(depositor, initialSupply)
      await asset.approve(tokenManager.address, initialSupply, { from: depositor })
      await depositManager.enableDepositAsset(asset.address, { from: owner })
    })

    context('when the depositor does not have enough balance', () => {
      it('reverts deposit', async () => {
        await expectRevert.unspecified(
          depositManager.deposit(asset.address, term, toFixedBN(101), { from: depositor })
        )
      })
    })
  })
})
