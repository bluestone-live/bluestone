const DepositManager = artifacts.require('DepositManager')
const TokenManager = artifacts.require('TokenManager')
const { shouldFail, time } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../../utils/index.js')

contract('DepositManager', ([owner, depositor]) => {
  let depositManager, tokenManager

  before(async () => {
    depositManager = await DepositManager.deployed() 
    tokenManager = await TokenManager.deployed()
  })

  describe('deposit flow negative #2', () => {
    const initialSupply = toFixedBN(100)
    const term = 1
    let asset

    before(async () => {
      asset = await createERC20Token(depositor, initialSupply)
      await asset.approve(tokenManager.address, initialSupply, { from: depositor })
      await depositManager.enableDepositAsset(asset.address, { from: owner })
    })

    context('when the depositor does not have enough balance', () => {
      it('reverts deposit', async () => {
        await shouldFail.reverting(
          depositManager.deposit(asset.address, term, toFixedBN(101), false, { from: depositor })
        )
      })
    })
  })
})
