const Configuration = artifacts.require('./Configuration.sol')

const setCoefficient = async (depositTerm, loanTerm, decimalValue) => {
  const configuration = await Configuration.deployed()
  const scaledValue = web3.utils.toBN(decimalValue * Math.pow(10, 18))

  console.log(`Setting coefficient a${depositTerm}${loanTerm} to ${decimalValue}...`)
  await configuration.setCoefficient(depositTerm, loanTerm, scaledValue)
  console.log('Done!')
}

module.exports = async(
 callback = () => {},
  depositTerm = process.argv[4],
  loanTerm = process.argv[5],
  decimalValue = process.argv[6]
) => {
  if (!depositTerm || !loanTerm || !decimalValue) {
    console.error('Invalid arguments. See usage in README.')
    return false
  }

  try {
    await setCoefficient(depositTerm, loanTerm, decimalValue)
    callback()
    return true
  } catch (err) {
    console.error(err)
    callback()
    return false
  }
}
