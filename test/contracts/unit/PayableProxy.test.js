const PayableProxy = artifacts.require('PayableProxyMock');
const Protocol = artifacts.require('Protocol');
const WETH9 = artifacts.require('WETH9');
const { BN } = require('openzeppelin-test-helpers');
const { toFixedBN } = require('../../utils/index.js');
const { expect } = require('chai');

contract('PayableProxy', function([owner, account]) {
  let payableProxy, protocol, WETH;
  const transferAmount = toFixedBN(2);

  beforeEach(async () => {
    WETH = await WETH9.new();
    protocol = await Protocol.new();
    payableProxy = await PayableProxy.new(protocol.address);
    payableProxy.setWETHAddress(WETH.address);

    protocol.setPayableProxy(payableProxy.address);
  });

  describe('#receiveETH', () => {
    it('succeed', async () => {
      const originalETHBalance = await web3.eth.getBalance(account);

      await payableProxy.receiveETH({
        from: account,
        value: transferAmount,
      });

      const ethBalance = await web3.eth.getBalance(account);
      expect(await WETH.balanceOf(protocol.address)).to.bignumber.equal(
        transferAmount,
      );
    });
  });

  describe('#sendETH', () => {
    beforeEach(async () => {
      await payableProxy.receiveETH({
        from: account,
        value: transferAmount,
      });
    });
    it('succeed', async () => {
      const originalBalance = new BN(await web3.eth.getBalance(account));
      await payableProxy.sendETH(account, transferAmount);
      const balance = new BN(await web3.eth.getBalance(account));
      expect(balance.sub(originalBalance)).to.bignumber.equal(transferAmount);
      expect(await WETH.balanceOf(protocol.address)).to.bignumber.equal(
        toFixedBN(0),
      );
    });
  });
});
