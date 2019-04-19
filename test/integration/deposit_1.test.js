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

  describe('deposit #1', () => {
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

    const depositId = 0

    it('enables deposit recurring', async () => {
      await depositManager.setRecurringDeposit(asset.address, depositId, true, { from: depositor })
    })

    it('disables deposit recurring', async () => {
      await depositManager.setRecurringDeposit(asset.address, depositId, false, { from: depositor })
    })

    context('when deposit term is matured', () => {
      before(async () => {
        await time.increase(time.duration.hours(25))        
      })

      it('withdraws deposit', async () => {
        await depositManager.withdraw(asset.address, depositId, { from: depositor })
      })
    })

    context('when the depositor does not have enough balance', () => {
      it('reverts deposit', async () => {
        await shouldFail.reverting(
          depositManager.deposit(asset.address, term, toFixedBN(51), false, { from: depositor })
        )
      })
    })

    context('when the asset is disabled', () => {
      before(async () => {
        await depositManager.disableDepositAsset(asset.address, { from: owner })
      })

      it('reverts deposit', async() => {
        await shouldFail.reverting(
          depositManager.deposit(asset.address, term, toFixedBN(50), false, { from: depositor })
        )
      })
    })
  })
})
