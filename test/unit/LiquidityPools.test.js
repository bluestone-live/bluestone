const LiquidityPools = artifacts.require('LiquidityPools')
const { shouldFail, constants } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../Utils.js')
const { expect } = require('chai')

contract('LiquidityPools', ([owner, account]) => {
  let liquidityPools, asset

  before(async () => {
    liquidityPools = await LiquidityPools.deployed()
  })

  describe('#initPoolGroupsIfNeeded', () => {
    let pool1Address, pool7Address, pool30Address

    context('when pool groups are not initialized', () => {
      before(async () => {
        asset = await createERC20Token(account)
      })

      it('succeeds', async () => {
        await liquidityPools.initPoolGroupsIfNeeded(asset.address)
      })

      it('initializes pool groups', async () => {
        pool1Address = await liquidityPools.poolGroups(asset.address, 1)
        pool7Address = await liquidityPools.poolGroups(asset.address, 7)
        pool30Address = await liquidityPools.poolGroups(asset.address, 30)

        expect(pool1Address).to.not.equal(constants.ZERO_ADDRESS)
        expect(pool7Address).to.not.equal(constants.ZERO_ADDRESS)
        expect(pool30Address).to.not.equal(constants.ZERO_ADDRESS)
      })

      it('updates isPoolGroupsInitialized', async () => {
        expect(await liquidityPools.isPoolGroupsInitialized(asset.address)).to.be.true
      })
    })

    context('after pool groups have already been initialized', () => {
      it('does nothing', async () => {
        await liquidityPools.initPoolGroupsIfNeeded(asset.address)

        const updatedPool1Address = await liquidityPools.poolGroups(asset.address, 1)
        const updatedPool7Address = await liquidityPools.poolGroups(asset.address, 7)
        const updatedPool30Address = await liquidityPools.poolGroups(asset.address, 30)

        expect(updatedPool1Address).to.equal(pool1Address)
        expect(updatedPool7Address).to.equal(pool7Address)
        expect(updatedPool30Address).to.equal(pool30Address)
      })
    })
  })
})
