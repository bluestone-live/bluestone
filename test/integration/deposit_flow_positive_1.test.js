const TokenManager = artifacts.require('TokenManager')
const Configuration = artifacts.require('Configuration')
const DateTime = artifacts.require('DateTime')
const { shouldFail, time } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../Utils.js')
const { DepositManagerMock } = require('../Mocks.js')

contract('DepositManager', ([owner, depositor]) => {
  let depositManager, tokenManager, config, datetime

  before(async () => {
    depositManager = await DepositManagerMock() 
    tokenManager = await TokenManager.deployed()
    config = await Configuration.deployed()
    datetime = await DateTime.new()
    await config.setShareholderAddress(owner)
  })

  describe('deposit flow positive #1', () => {
    const initialSupply = toFixedBN(100)
    const term = 1
    let asset

    before(async () => {
      asset = await createERC20Token(depositor, initialSupply)
      await asset.approve(tokenManager.address, initialSupply, { from: depositor })
      await depositManager.enableDepositAsset(asset.address, { from: owner })
    })

    let depositId

    it('deposits without recurring', async () => {
      await depositManager.deposit(asset.address, term, toFixedBN(50), false, { from: depositor })
      depositId = await depositManager.depositIds.call(0)
    })

    it('enables deposit recurring', async () => {
      await depositManager.setRecurringDeposit(asset.address, depositId, true, { from: depositor })
    })

    it('disables deposit recurring', async () => {
      await depositManager.setRecurringDeposit(asset.address, depositId, false, { from: depositor })
    })

    context('when deposit term is matured', () => {
      before(async () => {
        const now = await time.latest()
        const secondsUntilMidnight = await datetime.secondsUntilMidnight(now)

        // At the first midnight, update interest index
        await time.increase(secondsUntilMidnight)        
        await depositManager.updateInterestIndexHistories(asset.address, { from: owner })

        // At the second midnight, update interest index
        await time.increase(time.duration.days(1))
        depositManager.updateInterestIndexHistories(asset.address, { from: owner })

        // Pass through the second midnight
        await time.increase(time.duration.hours(1))
      })

      it('withdraws deposit', async () => {
        await depositManager.withdraw(asset.address, depositId, { from: depositor })
      })
    })
  })
})
