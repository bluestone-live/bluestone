const deployTokens = require("../../scripts/javascript/deployTokens.js");
const enableDepositAsset = require("../../scripts/javascript/enableDepositAsset.js");
const updateDepositMaturity = require("../../scripts/javascript/updateDepositMaturity.js");
const setUserActionsLock = require("../../scripts/javascript/setUserActionsLock");
const { expect } = require("chai");

describe("script: updateDepositMaturity", () => {
  const cb = () => {};
  const network = "development";

  before(async () => {
    await deployTokens(cb, network);
  });

  contract("DepositManager", () => {
    before(async () => {
      await enableDepositAsset(cb, network, "ETH");
      await enableDepositAsset(cb, network, "DAI");
      await enableDepositAsset(cb, network, "USDT");
    });

    it("succeeds", async () => {
      await setUserActionsLock(cb, network, "1");
      const res = await updateDepositMaturity(cb, network);
      await setUserActionsLock(cb, network, "0");
      expect(res).to.be.true;
    });
  });
});
