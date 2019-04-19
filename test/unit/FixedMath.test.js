const FixedMath = artifacts.require('FixedMathMock')
const { toFixedBN } = require('../Utils.js')
const { expect } = require('chai')

contract('FixedMath', () => {
  let fixedMath

  beforeEach(async () => {
    fixedMath = await FixedMath.new()
  })

  describe('#mulFixed', () => {
    it('succeeds if decimal', async () => {
      const a = toFixedBN(0.5)
      const b = toFixedBN(0.3)

      expect(await fixedMath.mulFixed(a, b)).to.be.bignumber.equal(toFixedBN(0.15))
    })

    it('succeeds if integer', async () => {
      const a = toFixedBN(5)
      const b = toFixedBN(3)

      expect(await fixedMath.mulFixed(a, b)).to.be.bignumber.equal(toFixedBN(15))
    })

    it('succeeds if left is zero', async () => {
      const a = toFixedBN(0)
      const b = toFixedBN(0.3)

      expect(await fixedMath.mulFixed(a, b)).to.be.bignumber.equal(a)
    })

    it('succeeds if right is zero', async () => {
      const a = toFixedBN(0.3)
      const b = toFixedBN(0)

      expect(await fixedMath.mulFixed(a, b)).to.be.bignumber.equal(b)
    })

    it('succeeds if left is one', async () => {
      const a = toFixedBN(1)
      const b = toFixedBN(0.3)

      expect(await fixedMath.mulFixed(a, b)).to.be.bignumber.equal(b)
    })

    it('succeeds if right is one', async () => {
      const a = toFixedBN(0.5)
      const b = toFixedBN(1)

      expect(await fixedMath.mulFixed(a, b)).to.be.bignumber.equal(a)
    })

    // TODO: Add more cases
  })
})
