const Protocol = artifacts.require("Protocol");
const { expectRevert } = require("openzeppelin-test-helpers");
const { expect } = require("chai");

contract("Protocol", function() {
  let protocol;

  beforeEach(async () => {
    protocol = await Protocol.new();
  });

  describe("#addLoanTerm", () => {
    const term = 60;

    context("when term does not exist", () => {
      it("succeeds", async () => {
        await protocol.addLoanTerm(term);
        const currTerms = await protocol.getLoanTerms();
        expect(currTerms.length).to.equal(1);
        expect(currTerms.map(term => term.toNumber())).to.contain(term);
      });
    });

    context("when term already exists", () => {
      beforeEach(async () => {
        await protocol.addLoanTerm(term);
      });

      it("reverts", async () => {
        await expectRevert(
          protocol.addLoanTerm(term),
          "LoanManager: term already exists"
        );
      });
    });
  });

  describe("#removeLoanTerm", () => {
    const term = 60;

    context("when term already exists", () => {
      beforeEach(async () => {
        await protocol.addLoanTerm(term);
      });

      it("succeeds", async () => {
        await protocol.removeLoanTerm(term);
        const currTerms = await protocol.getLoanTerms();
        expect(currTerms.length).to.equal(0);
        expect(currTerms.map(term => term.toNumber())).to.not.contain(term);
      });
    });

    context("when term does not exist", () => {
      it("reverts", async () => {
        await expectRevert(
          protocol.removeLoanTerm(term),
          "LoanManager: term does not exist"
        );
      });
    });
  });
});
