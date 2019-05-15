# Scripts

Here we describe each script and their usages (assuming invoked from root directory). All js scripts should be exectued by [truffle exec](https://truffleframework.com/docs/truffle/getting-started/writing-external-scripts), which helps us connect to the Ethereum client and access to truffle environment.

Argument description:

- `<token-symbol>`: Can be `ETH`, `DAI` or `USDC`.

## deployTokens.js

Deploy tokens to test network. 

``` 
npx truffle exec scripts/deployTokens.js
```

## disableDepositAsset.js

Disable an asset for deposit. The target asset must not be already disabled.

```
npx truffle exec scripts/disableDepositAsset.js <token-symbol>
```

For example, to disable `ETH`:

```
npx truffle exec scripts/disableDepositAsset.js ETH
```

## disableLoanAssetPair.js

Disable an asset pair for loan. The target asset pair must not be already disabled.

```
npx truffle exec scripts/disableLoanAssetPair.js <loan-token-symbol> <collateral-token-symbol>
```

For example, to disable asset pair `ETH` and `DAI`:

```
npx truffle exec scripts/disableLoanAssetPair.js ETH DAI
```

## enableDepositAsset.js

Enable an asset for deposit. The target asset must not be already enabled.

```
npx truffle exec scripts/enableDepositAsset.js <token-symbol>
```

For example, to enable `ETH`:

```
npx truffle exec scripts/enableDepositAsset.js ETH
```

## enableLoanAssetPair.js

Enable an asset pair for loan. The target asset pair must not be already enabled.

```
npx truffle exec scripts/enableLoanAssetPair.js <loan-token-symbol> <collateral-token-symbol>
```

For example, to enable asset pair `ETH` and `DAI`:

```
npx truffle exec scripts/enableLoanAssetPair.js ETH DAI
```

## postTokenPrices.js

Fetch new token prices and post them to the PriceOracle. This script will be ran periodically by the server, so we do not need to run it by hand.

```
npx truffle exec scripts/postTokenPrices.js
```
