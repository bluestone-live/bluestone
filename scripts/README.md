# Scripts

Here we describe each script and their usages (assuming invoked from root directory).

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

Valid `<token-symbol>` are `ETH`, `DAI` and `USDC`. For example, to disable `ETH`:

```
npx truffle exec scripts/disableDepositAsset.js ETH
```

## enableDepositAsset.js

Enable an asset for deposit. The target asset must not be already enabled.

```
npx truffle exec scripts/enableDepositAsset.js <token-symbol>
```

Valid `<token-symbol>` are `ETH`, `DAI` and `USDC`. For example, to enable `ETH`:

```
npx truffle exec scripts/enableDepositAsset.js ETH
```

## postTokenPrices.js

Fetch new token prices and post them to the PriceOracle. This script will be ran periodically by the server, so we do not need to run it by hand.

```
npx truffle exec scripts/postTokenPrices.js
```
