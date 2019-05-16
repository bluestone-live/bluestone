# Scripts

Here we describe each script and their usages (assuming invoked from root directory). All js scripts should be exectued by [truffle exec](https://truffleframework.com/docs/truffle/getting-started/writing-external-scripts), which helps us connect to the Ethereum client and access to truffle environment.

Common arguments:

- `<token-symbol>`: Can be `ETH`, `DAI` or `USDC`.
- `<contract-name>`: The name of a contract, e.g., `DepositManager`.

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

## pauseContract.js

Pause a contract that inherits from `Pausable` contract. 

```
npx truffle exec scripts/pauseContract.js <contract-name>
```

For example, to pause `DepositManager`:

```
npx truffle exec scripts/pauseContract.js DepositManager 
```

## setCoefficient.js

Set coefficient `a`. The decimal value must not be greater than 1.

```
npx truffle exec scripts/setCoefficient.js <deposit-term> <loan-term> <decimal-value>
```

For example:

```
npx truffle exec scripts/setCoefficient.js 30 7 0.33
```

## unpauseContract.js

Unpause a contract that inherits from `Pausable` contract. 

```
npx truffle exec scripts/unpauseContract.js <contract-name>
```

For example, to unpause `DepositManager`:

```
npx truffle exec scripts/unpauseContract.js DepositManager 
```

## postTokenPrices.js

Fetch new token prices and post them to the PriceOracle. This script will be ran periodically by the server, so we do not need to run it by hand.

```
npx truffle exec scripts/postTokenPrices.js
```
