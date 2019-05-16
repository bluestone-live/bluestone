const pauseContract = async (contractName) => {
  const Contract = artifacts.require(`./${contractName}.sol`)
  const contract = await Contract.deployed()

  console.log(`Pausing ${contractName}...`)
  await contract.pause()
  console.log('Done!')
}

module.exports = async (callback = () => {}, contractName = process.argv[4]) => {
  if (!contractName) {
    console.error('You must provide <contract-name> as argument.')
    return false
  }

  try {
    await pauseContract(contractName)
    callback()
    return true
  } catch (err) {
    console.error(err)
    callback()
    return false
  }
}
