const LoanManager = artifacts.require("LoanManager");
const { expectRevert, constants } = require("openzeppelin-test-helpers");
const { expect } = require("chai");

contract("LoanManager", ([owner, depositor]) => {
  let loanManager;

  before(async () => {
    loanManager = await LoanManager.deployed();
  });

  describe("pause loan manager", () => {
    const asset = constants.ZERO_ADDRESS;

    context("when paused", () => {
      before(async () => {
        await loanManager.pause();
      });

      // TODO test actions
    });

    context("when unpaused", () => {
      before(async () => {
        await loanManager.unpause();
      });

      // TODO test actions
    });
  });
});
