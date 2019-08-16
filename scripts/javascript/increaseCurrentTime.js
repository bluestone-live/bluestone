const { makeTruffleScript } = require("./utils.js");
const debug = require("debug")("script:increaseCurrentTime");

module.exports = makeTruffleScript(async timeInSecond => {
  const timeBefore = (await web3.eth.getBlock("latest")).timestamp;
  web3.currentProvider.send.bind(web3.currentProvider)(
    {
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [Number.parseInt(timeInSecond)],
      id: new Date().getTime()
    },
    debug
  );
  await web3.currentProvider.send.bind(web3.currentProvider)(
    {
      jsonrpc: "2.0",
      method: "evm_mine",
      params: [],
      id: new Date().getTime()
    },
    debug
  );
  const timeAfter = (await web3.eth.getBlock("latest")).timestamp;
  debug(`time have increased from ${timeBefore} to ${timeAfter}`);
});
