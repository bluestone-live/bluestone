const DepositManager = artifacts.require('DepositManager')
const TokenManager = artifacts.require('TokenManager')
const { shouldFail, time } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../Utils.js')

contract('DepositManager', ([owner, depositor]) => {
  let depositManager, tokenManager

  before(async () => {
    depositManager = await DepositManager.deployed() 
    tokenManager = await TokenManager.deployed()
  })

  describe('deposit flow negative #3', () => {
    const initialSupply = toFixedBN(100)
    const term = 1
    let asset

    before(async () => {
      asset = await createERC20Token(depositor, initialSupply)
      await asset.approve(tokenManager.address, initialSupply, { from: depositor })
      await depositManager.enableDepositAsset(asset.address, { from: owner })
    })

    it('deposits without recurring', async () => {
      await depositManager.deposit(asset.address, term, toFixedBN(50), false, { from: depositor })
    })

    context('when the deposit is not mature', () => {
      const depositId = 0

      it('reverts withdraw', async() => {
        await shouldFail.reverting(
          depositManager.withdraw(asset.address, depositId, { from: depositor })
        )
      })
    })
  })
})
