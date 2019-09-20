const { makeTruffleScript } = require('./utils.js');

module.exports = makeTruffleScript(async (_, contractName) => {
  const Contract = artifacts.require(`./${contractName}.sol`);
  const contract = await Contract.deployed();
  await contract.unpause();
});
