const { makeTruffleScript } = require('./utils.js')

module.exports = makeTruffleScript(async contractName => {
  const Contract = artifacts.require(`./${contractName}.sol`)
  const contract = await Contract.deployed()
  await contract.pause()
})
