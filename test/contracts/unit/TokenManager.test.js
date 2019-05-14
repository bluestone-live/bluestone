const TokenManager = artifacts.require('TokenManager')
const { shouldFail } = require('openzeppelin-test-helpers')
const { createERC20Token, toFixedBN } = require('../../utils/index.js')
const { expect } = require('chai')

contract('TokenManager', ([owner, customer]) => {
  const initialSupply = toFixedBN(100)
  let tokenManager, asset

  before(async () => {
    tokenManager = await TokenManager.deployed()
  })

  describe('#receiveFrom', () => {
    const amount = toFixedBN(10)

    context('when enough amount is approved', () => {
      before(async () => {
        asset = await createERC20Token(customer, initialSupply)
        await asset.approve(tokenManager.address, amount, { from: customer })
      })

      it('succeeds', async () => {
        await tokenManager.receiveFrom(customer, asset.address, amount)
      })

      it('reduces tokens from customer balance', async () => {
        expect(await asset.balanceOf(customer)).to.be.bignumber.equal(initialSupply.sub(amount))
      })

      it('transfers tokens to protocol balance', async () => {
        expect(await asset.balanceOf(tokenManager.address)).to.be.bignumber.equal(amount)
      })
    })

    context('when not enough amount is approved', () => {
      before(async () => {
        await asset.approve(tokenManager.address, amount.sub(toFixedBN(1)), { from: customer })
      })

      it('reverts', async () => {
        await shouldFail.reverting(
          tokenManager.receiveFrom(customer, asset.address, amount)
        )
      })
    })
  })

  describe('#sendTo', () => {
    const amount = toFixedBN(10)

    context('when protocol balance is enough', () => {
      before(async () => {
        asset = await createERC20Token(tokenManager.address, initialSupply)
      })

      it('succeeds', async () => {
        await tokenManager.sendTo(customer, asset.address, amount)
      })

      it('reduces tokens from protocol balance', async () => {
        expect(await asset.balanceOf(tokenManager.address)).to.be.bignumber.equal(initialSupply.sub(amount))
      })

      it('transfers tokens to customer balance', async () => {
        expect(await asset.balanceOf(customer)).to.be.bignumber.equal(amount)
      })
    })

    context('when protocol balance is not enough', () => {
      before(async () => {
        asset = await createERC20Token(tokenManager.address, amount.sub(toFixedBN(1)))
      })

      it('reverts', async () => {
        await shouldFail.reverting(
          tokenManager.sendTo(customer, asset.address, amount)
        )
      })
    })
  })
})
