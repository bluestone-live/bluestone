const Core = artifacts.require('Core')
const { fakeAssetAddresses } = require('../Utils.js')
const { shouldFail } = require('openzeppelin-test-helpers')

contract('Core', function([owner, ...accounts]) {
  describe('setRiskParameters', () => {
    it('succeeds if called by owner', async () => {
      const core = await Core.deployed()
      const { ETH: asset, DAI: collateral } = fakeAssetAddresses

      // web3 has issue with parsing big number, a workaround is to convert it to string
      // https://github.com/ethereum/web3.js/issues/2077#issuecomment-468526280
      const newCollateralRatio = 15e17.toString()
      const newLiquidationDiscount = 3e16.toString()

      await core.setRiskParameters(
        asset, 
        collateral, 
        newCollateralRatio,
        newLiquidationDiscount, 
        { from: owner }
      )

      const actualCollateralRatio = await core.collateralRatioMap.call(asset, collateral)
      const actualLiquidationDiscount = await core.liquidationDiscountMap.call(asset, collateral)

      assert.equal(actualCollateralRatio, newCollateralRatio)
      assert.equal(actualLiquidationDiscount, newLiquidationDiscount)
    })

    it('fails if not called by owner', async () => {
      const core = await Core.deployed()
      const { ETH: asset, DAI: collateral } = fakeAssetAddresses
      const newCollateralRatio = 15e17.toString()
      const newLiquidationDiscount = 3e16.toString()

      const promise = core.setRiskParameters(
        asset, 
        collateral, 
        newCollateralRatio,
        newLiquidationDiscount, 
        { from: accounts[1] }
      )

      await shouldFail.reverting(promise)
    })

    it('fails if collateral ratio is invalid', async () => {
      const core = await Core.deployed()
      const { ETH: asset, DAI: collateral } = fakeAssetAddresses
      const newCollateralRatio = 11e17.toString()
      const newLiquidationDiscount = 3e16.toString()

      const promise = core.setRiskParameters(
        asset, 
        collateral, 
        newCollateralRatio,
        newLiquidationDiscount, 
        { from: owner }
      )

      await shouldFail.reverting(promise)
    })

    it('fails if liquidation discount is invalid', async () => {
      const core = await Core.deployed()
      const { ETH: asset, DAI: collateral } = fakeAssetAddresses
      const newCollateralRatio = 15e17.toString()
      const newLiquidationDiscount = 6e16.toString()

      const promise = core.setRiskParameters(
        asset, 
        collateral, 
        newCollateralRatio,
        newLiquidationDiscount, 
        { from: owner }
      )

      await shouldFail.reverting(promise)
    })
  })
})
