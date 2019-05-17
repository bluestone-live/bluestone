# Scripts

## bash

Use `help` to find out about usage info for each script, for example:

```
./scripts/bash/deployTokens help
```

## javascript

Currently, all js scripts are called by bash scripts internally. They are written to be executed by [truffle exec](https://truffleframework.com/docs/truffle/getting-started/writing-external-scripts), which helps us connect to the Ethereum client and access to truffle environment.
