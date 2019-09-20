const Configuration = artifacts.require('./Configuration.sol');
const { getTokenAddress, makeTruffleScript } = require('./utils.js');

module.exports = makeTruffleScript(
  async (_, loanTokenSymbol, collateralTokenSymbol, decimalValue) => {
    const config = await Configuration.deployed();
    const loanAsset = await getTokenAddress(loanTokenSymbol);
    const collateralAsset = await getTokenAddress(collateralTokenSymbol);
    const scaledValue = web3.utils.toBN(decimalValue * Math.pow(10, 18));

    await config.setLiquidationDiscount(
      loanAsset,
      collateralAsset,
      scaledValue,
    );

    return [loanAsset, collateralAsset];
  },
);
