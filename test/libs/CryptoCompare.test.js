const CryptoCompare = require('../../libs/CryptoCompare.js');
const config = require('../../config.js');
const { expect } = require('chai');

describe('lib: CryptoCompare', function() {
  this.retries(2);

  const { apiKey } = config.cryptocompare;
  const cryptoCompare = new CryptoCompare(apiKey);

  describe('#getMultipleSymbolsPrice', () => {
    it('gets prices for ETH, DAI and USDT', async () => {
      const symbols = ['ETH', 'DAI', 'USDT'];

      const res = await cryptoCompare.getMultipleSymbolsPrice({
        fsyms: symbols.join(','),
        tsyms: 'USD',
      });

      for (let symbol of symbols) {
        expect(res).to.have.property(symbol);
        expect(res).to.have.nested.property(`${symbol}.USD`);
      }
    });
  });
});
