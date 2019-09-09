const Protocol = artifacts.require("Protocol");
const { expectRevert, constants } = require("openzeppelin-test-helpers");
const { expect } = require("chai");

contract("Protocol", function([owner]) {
  let protocol;

  beforeEach(async () => {
    protocol = await Protocol.new();
  });

  describe("#setProtocolAddress", () => {
    context("when address is invalid", () => {
      it("reverts", async () => {
        await expectRevert(
          protocol.setProtocolAddress(constants.ZERO_ADDRESS),
          "Configuration: invalid protocol address"
        );
      });
    });

    context("when address is valid", () => {
      it("succeeds", async () => {
        await protocol.setProtocolAddress(owner);
        expect(await protocol.getProtocolAddress()).to.equal(owner);
      });
    });
  });
});
