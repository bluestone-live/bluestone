const { makeTruffleScript } = require("./utils.js");
const debug = require("debug")("script:increaseCurrentTime");

module.exports = makeTruffleScript(async timeInSecond => {
  const timeBefore = (await web3.eth.getBlock("latest")).timestamp;
  web3.currentProvider.send(
    {
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [Number.parseInt(timeInSecond)]
    },
    debug
  );
  web3.currentProvider.send(
    {
      jsonrpc: "2.0",
      method: "evm_mine",
      params: []
    },
    debug
  );
  const timeAfter = (await web3.eth.getBlock("latest")).timestamp;
  debug(`time have increased from ${timeBefore} to ${timeAfter}`);
});
