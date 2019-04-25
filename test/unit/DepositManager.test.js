const { shouldFail, time } = require('openzeppelin-test-helpers')
const { toFixedBN, createERC20Token } = require('../Utils.js')
const { DepositManagerMock } = require('../Mocks.js')
const { expect } = require('chai')

contract('DepositManager', ([owner, anotherAccount]) => {
  let depositManager, asset

  before(async () => {
    depositManager = await DepositManagerMock()
    asset = await createERC20Token(owner)
    await depositManager.enableDepositAsset(asset.address)
  })

  describe('#updateInterestIndexHistory', () => {
    const initialInterestIndex = toFixedBN(1)
    const updatedInterestIndex = toFixedBN(2)
    const term = 1
    const numDays = 30

    before(async () => {
      await depositManager.prepareInterestIndexHistory(asset.address, term, initialInterestIndex, numDays)
    })

    it('succeeds', async () => {
      await depositManager.updateInterestIndexHistory(asset.address, term, updatedInterestIndex)
    })

    it('updates interestIndex of lastDay', async () => {
      const actualInterestIndex = await depositManager.getInterestIndexFromDaysAgo(asset.address, term, 1);
      expect(actualInterestIndex).to.be.bignumber.equal(updatedInterestIndex)
    })

    it('does not update interestIndex of the day before lastDay', async () => {
      const actualInterestIndex = await depositManager.getInterestIndexFromDaysAgo(asset.address, term, 2);
      expect(actualInterestIndex).to.be.bignumber.equal(initialInterestIndex)
    })

    it('does not update interestIndex of firstDay', async () => {
      const actualInterestIndex = await depositManager.getInterestIndexFromDaysAgo(asset.address, term, numDays);
      expect(actualInterestIndex).to.be.bignumber.equal(initialInterestIndex)
    })

    it('clears interestIndex of the day before firstDay', async () => {
      const actualInterestIndex = await depositManager.getInterestIndexFromDaysAgo(asset.address, term, numDays + 1);
      expect(actualInterestIndex).to.be.bignumber.equal('0')
    })
  })
})

