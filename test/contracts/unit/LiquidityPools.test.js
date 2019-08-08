const LiquidityPools = artifacts.require('LiquidityPools')
const { constants } = require('openzeppelin-test-helpers')
const { createERC20Token } = require('../../utils/index.js')
const { expect } = require('chai')

contract('LiquidityPools', ([owner, account]) => {
  let liquidityPools, asset

  before(async () => {
    liquidityPools = await LiquidityPools.deployed()
  })

  describe('#initPoolGroupIfNeeded', () => {
    const depositTerm = 30
    let pool30Address

    context('when pool group is not initialized', () => {
      before(async () => {
        asset = await createERC20Token(account)
      })

      it('succeeds', async () => {
        await liquidityPools.initPoolGroupIfNeeded(asset.address, depositTerm)
      })

      it('initializes pool group', async () => {
        pool30Address = await liquidityPools.poolGroups(asset.address, depositTerm)

        expect(pool30Address).to.not.equal(constants.ZERO_ADDRESS)
      })
    })

    context('after pool group has already been initialized', () => {
      it('does nothing', async () => {
        await liquidityPools.initPoolGroupIfNeeded(asset.address, depositTerm)

        const updatedPool30Address = await liquidityPools.poolGroups(asset.address, 30)

        expect(updatedPool30Address).to.equal(pool30Address)
      })
    })
  })
})
