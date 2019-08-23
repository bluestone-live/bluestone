const Configuration = artifacts.require("Configuration");
const setUserActionsLock = require("../../scripts/javascript/setUserActionsLock.js");
const { expect } = require("chai");

describe("script: setUserActionsLock", () => {
  let config;
  let cb = () => {};
  const network = "development";

  before(async () => {
    config = await Configuration.deployed();
  });

  contract("Configuration", () => {
    context("when input is valid", () => {
      it("fails", async () => {
        const succeed = await setUserActionsLock(cb, network, "true");
        expect(succeed).to.false;
      });
    });

    context("when value is '0'", () => {
      it("succeed and lock user actions", async () => {
        const succeed = await setUserActionsLock(cb, network, "0");
        expect(succeed).to.true;
        expect(await config.isUserActionsLocked()).to.be.false;
      });
    });

    context("when value is '1'", () => {
      it("succeed and unlock user actions", async () => {
        const succeed = await setUserActionsLock(cb, network, "1");
        expect(succeed).to.true;
        expect(await config.isUserActionsLocked()).to.be.true;
      });
    });
  });
});
