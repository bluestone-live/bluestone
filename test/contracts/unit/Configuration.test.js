const Configuration = artifacts.require("Configuration");
const { expectRevert } = require("openzeppelin-test-helpers");
const { createERC20Token, toFixedBN } = require("../../utils/index.js");
const { expect } = require("chai");

contract("Configuration", function([owner, anotherAccount]) {
  let config, token;

  before(async () => {
    config = await Configuration.deployed();
    token = await createERC20Token(owner);
  });

  describe("#setCoefficient", () => {
    const depositTerm = 1;
    const loanTerm = 1;
    const value = toFixedBN(0.5);

    it("succeeds", async () => {
      await config.setCoefficient(token.address, depositTerm, loanTerm, value, {
        from: owner
      });
      expect(
        await config.getCoefficient(token.address, depositTerm, loanTerm)
      ).to.be.bignumber.equal(value);
    });
  });

  describe("#setLoanInterestRate", () => {
    let loanAsset;

    before(async () => {
      loanAsset = await createERC20Token(owner);
    });

    const loanTerm = 1;
    const value = toFixedBN(0.05);

    it("succeeds", async () => {
      await config.setLoanInterestRate(loanAsset.address, loanTerm, value, {
        from: owner
      });
      expect(
        await config.getLoanInterestRate(loanAsset.address, loanTerm)
      ).to.be.bignumber.equal(value);
    });
  });

  describe("#setCollateralRatio", () => {
    let loanAsset, collateralAsset;

    before(async () => {
      loanAsset = await createERC20Token(owner);
      collateralAsset = await createERC20Token(owner);
    });

    context("when collateral ratio is valid", () => {
      const collateralRatio = toFixedBN(1.5);

      it("succeeds", async () => {
        await config.setCollateralRatio(
          loanAsset.address,
          collateralAsset.address,
          collateralRatio,
          { from: owner }
        );

        const res = await config.getCollateralRatio(
          loanAsset.address,
          collateralAsset.address
        );
        expect(res).to.be.bignumber.equal(collateralRatio);
      });
    });

    context("when collateral ratio is invalid", () => {
      const collateralRatio = toFixedBN(1.1);

      it("reverts", async () => {
        await expectRevert.unspecified(
          config.setCollateralRatio(
            loanAsset.address,
            collateralAsset.address,
            collateralRatio,
            { from: owner }
          )
        );
      });
    });
  });

  describe("#setLiquidationDiscount", () => {
    let loanAsset, collateralAsset;

    before(async () => {
      loanAsset = await createERC20Token(owner);
      collateralAsset = await createERC20Token(owner);
    });

    context("when liquidation discount is valid", () => {
      const liquidationDiscount = toFixedBN(0.03);

      it("succeeds", async () => {
        await config.setLiquidationDiscount(
          loanAsset.address,
          collateralAsset.address,
          liquidationDiscount,
          { from: owner }
        );

        const res = await config.getLiquidationDiscount(
          loanAsset.address,
          collateralAsset.address
        );
        expect(res).to.be.bignumber.equal(liquidationDiscount);
      });
    });

    context("when liquidation discount is invalid", () => {
      const liquidationDiscount = toFixedBN(0.06);

      it("reverts", async () => {
        await expectRevert.unspecified(
          config.setLiquidationDiscount(
            loanAsset.address,
            collateralAsset.address,
            liquidationDiscount,
            { from: owner }
          )
        );
      });
    });
  });
});
