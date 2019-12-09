const debug = require('debug')('script:increaseTime');
const { makeTruffleScript } = require('../utils.js');

module.exports = makeTruffleScript(async (_, timeInDays) => {
  try {
    await web3.currentProvider.send.bind(web3.currentProvider)(
      {
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [3600 * 24 * Number.parseInt(timeInDays, 10)],
        id: new Date().getTime(),
      },
      () => {},
    );

    await web3.currentProvider.send.bind(web3.currentProvider)(
      {
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: new Date().getTime(),
      },
      () => {},
    );

    const now = await web3.eth.getBlock('latest');

    debug(`Now the time is increased to ${new Date(now.timestamp * 1000)}`);
  } catch (e) {
    console.log(e);
  }
});
