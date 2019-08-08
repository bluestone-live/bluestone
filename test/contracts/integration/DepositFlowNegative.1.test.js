const TokenManager = artifacts.require('TokenManager')
const { shouldFail } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../../utils/index.js')
const { DepositManagerMock } = require('../../utils/mocks.js')

contract('DepositManager', ([owner, depositor]) => {
  let depositManager, tokenManager

  before(async () => {
    depositManager = await DepositManagerMock()
    tokenManager = await TokenManager.deployed()
  })

  describe('deposit flow negative #1', () => {
    const initialSupply = toFixedBN(100)
    let term, asset

    before(async () => {
      term = (await depositManager.getDepositTerms())[0]
      asset = await createERC20Token(depositor, initialSupply)
      await asset.approve(tokenManager.address, initialSupply, { from: depositor })
    })

    context('when the asset is disabled', () => {
      it('reverts deposit', async() => {
        await shouldFail.reverting(
          depositManager.deposit(asset.address, term, toFixedBN(50), { from: depositor })
        )
      })
    })
  })
})
