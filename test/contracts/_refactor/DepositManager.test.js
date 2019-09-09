const Protocol = artifacts.require("Protocol");
const { expectRevert } = require("openzeppelin-test-helpers");
const { expect } = require("chai");

contract("Protocol", function() {
  let protocol;

  beforeEach(async () => {
    protocol = await Protocol.new();
  });

  describe("#enableDepositTerm", () => {
    const term = 60;

    context("when term is not enabled", () => {
      it("succeeds", async () => {
        await protocol.enableDepositTerm(term);
        const currTerms = await protocol.getDepositTerms();
        expect(currTerms.length).to.equal(1);
        expect(currTerms.map(term => term.toNumber())).to.contain(term);
      });
    });

    context("when term is enabled", () => {
      beforeEach(async () => {
        await protocol.enableDepositTerm(term);
      });

      it("reverts", async () => {
        await expectRevert(
          protocol.enableDepositTerm(term),
          "DepositManager: term already enabled"
        );
      });
    });
  });

  describe("#disableDepositTerm", () => {
    const term = 60;

    context("when term is enabled", () => {
      beforeEach(async () => {
        await protocol.enableDepositTerm(term);
      });

      it("succeeds", async () => {
        await protocol.disableDepositTerm(term);
        const currTerms = await protocol.getDepositTerms();
        expect(currTerms.length).to.equal(0);
        expect(currTerms.map(term => term.toNumber())).to.not.contain(term);
      });
    });

    context("when term is disabled", () => {
      it("reverts", async () => {
        await expectRevert(
          protocol.disableDepositTerm(term),
          "DepositManager: term already disabled"
        );
      });
    });
  });
});
