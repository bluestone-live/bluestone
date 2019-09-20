# Scripts

## Types

There are following types of script in this directory:

### bash

To find out about usage info for each script, simply run the script without no arguments:

```
./scripts/bash/deployTokens
```

### javascript

Currently, all js scripts are called by bash scripts internally. They are written to be executed by [truffle exec](https://truffleframework.com/docs/truffle/getting-started/writing-external-scripts), which helps us connect to the Ethereum client and access to truffle environment.

## Development

If you have made changes to a Solidity contract which has already deployed while testing out the script, you have to run `npx truffle migrate --reset` to redeploy all contracts (truffle is not capable of only reploying the changed contract at the moment). Don't forget to setup necessary preconditions for your script after migration, for example, you may want to deploy and enable tokens before running a specific script.

Here is a useful script to reset and initialize contract state for test environment:

```
./scripts/bash/setupEnvironment
```
