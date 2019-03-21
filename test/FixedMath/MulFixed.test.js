const FixedMath = artifacts.require('FixedMathMock')

contract('FixedMath', () => {
  let fixedMath

  beforeEach(async () => {
    fixedMath = await FixedMath.new()
  })

  describe('mulFixed', () => {
    it('succeeds if decimal', async () => {
      const a = 5e17.toString()
      const b = 3e17.toString()

      const product = await fixedMath.mulFixed(a, b)
      assert.equal(product, 15e16.toString())
    })

    it('succeeds if integer', async () => {
      const a = 5e18.toString()
      const b = 3e18.toString()

      const product = await fixedMath.mulFixed(a, b)
      assert.equal(product, 15e18.toString())
    })

    it('succeeds if left is zero', async () => {
      const a = 0
      const b = 3e17.toString()

      const product = await fixedMath.mulFixed(a, b)
      assert.equal(product, 0)
    })

    it('succeeds if right is zero', async () => {
      const a = 5e17.toString()
      const b = 0

      const product = await fixedMath.mulFixed(a, b)
      assert.equal(product, 0)
    })

    it('succeeds if left is one', async () => {
      const a = 1e18.toString()
      const b = 3e17.toString()

      const product = await fixedMath.mulFixed(a, b)
      assert.equal(product, b)
    })

    it('succeeds if right is one', async () => {
      const a = 5e17.toString()
      const b = 1e18.toString()

      const product = await fixedMath.mulFixed(a, b)
      assert.equal(product, a)
    })

    // TODO: Add more cases
  })
})
