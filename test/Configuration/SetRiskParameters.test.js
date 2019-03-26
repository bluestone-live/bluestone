const Configuration = artifacts.require('Configuration')
const { BN, shouldFail } = require('openzeppelin-test-helpers')
const { createERC20Token } = require('../Utils.js')

contract('Configuration', function([owner, ...accounts]) {
  let config, asset, collateral

  beforeEach(async () => {
    config = await Configuration.new()
    asset = (await createERC20Token(owner)).address
    collateral = (await createERC20Token(owner)).address
  })

  describe('setRiskParameters', () => {
    it('succeeds if called by owner', async () => {
      // web3 has issue with parsing big number, a workaround is to convert it to string
      // https://github.com/ethereum/web3.js/issues/2077#issuecomment-468526280
      const newCollateralRatio = 15e17.toString()
      const newLiquidationDiscount = 3e16.toString()

      await config.setRiskParameters(
        asset, 
        collateral, 
        newCollateralRatio,
        newLiquidationDiscount, 
        { from: owner }
      )

      const params = await config.getRiskParameters(asset, collateral)

      assert.equal(params['0'], newCollateralRatio)
      assert.equal(params['1'], newLiquidationDiscount)
    })

    it('fails if not called by owner', async () => {
      const newCollateralRatio = 15e17.toString()
      const newLiquidationDiscount = 3e16.toString()

      await shouldFail.reverting(
        config.setRiskParameters(
          asset, 
          collateral, 
          newCollateralRatio,
          newLiquidationDiscount, 
          { from: accounts[1] }
        )
      )
    })

    it('fails if collateral ratio is invalid', async () => {
      const newCollateralRatio = 11e17.toString()
      const newLiquidationDiscount = 3e16.toString()

      await shouldFail.reverting(
        config.setRiskParameters(
          asset, 
          collateral, 
          newCollateralRatio,
          newLiquidationDiscount, 
          { from: owner }
        )
      )
    })

    it('fails if liquidation discount is invalid', async () => {
      const newCollateralRatio = 15e17.toString()
      const newLiquidationDiscount = 6e16.toString()

      await shouldFail.reverting(
        config.setRiskParameters(
          asset, 
          collateral, 
          newCollateralRatio,
          newLiquidationDiscount, 
          { from: owner }
        )
      )
    })
  })
})
