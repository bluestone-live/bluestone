# Bluestone

## Prerequisite

Install the following tools:

- [Git](https://git-scm.com/downloads)
- [Arcanist](https://secure.phabricator.com/book/phabricator/article/arcanist_quick_start/)
- [Yarn](https://yarnpkg.com/en/docs/install)
- [Ganache](https://truffleframework.com/ganache): after launch, choose **QUICKSTART**.

Make sure you have read through [Truffle Documentation](https://truffleframework.com/docs/truffle/overview).

## Start Ganache server

download and install Ganache GUI or use cli command below:

```
# create a directory to save the chain database 
$ mkdir ~/<your_db_path>

# start up ganache server
$ npx ganache-cli -p 7545 --db ~/<your_db_path> -i="5777" -e 1000
```

## Setup

Create a config file for development purpose:

```
cp config.example.js config.js
```

Fill in any credentials if needed.

Install dependencies and migrate contracts:

```
yarn
npx truffle migrate
```

Prepare test environment for local development:

```
./scripts/bash/setupEnvironment
```

## Structure

- `arcanist-extensions/`: Custom PHP extensions written for arcanist.
- `contracts/`: Smart contracts written in Solidity. Two main contracts are `DepositManager.sol` and `LoanManager.sol`.
- `libs/`: Common libraries.
- `migrations/`: Truffle migrations. Each file will be ran in sequence on `npx truffle migrate` and corresponding contracts will be deployed.
- `scripts/`: Scripts to interact with smart contracts and run common tasks.
- `server/`: Everything related to a web server.
- `test/`: All test files go to this directory.
- `clients/`: All user interfaces using in React, Mobx and TypeScript.

More details may be presented in individual folder's README.

## Development

Read [here](http://47.244.8.26/w/workflow/) for general development workflow.

## Debugging

In many cases, we can get away with reading compiler error and try to locate errors in our code using `require()` statement with messages or commenting out code. However, there will be cases we can't figure out solely from useless compiler message, so we may need to print stuff out or debug line by line.

### Print data to the console

There is no print statement in Solidity, so we need to leverage [Events](https://solidity.readthedocs.io/en/latest/contracts.html#events):

```
contract Foo {
  event FooCreated(address creator, uint value);

  function foo(uint value) {
      emit FooCreated(msg.sender, value);
  }
}
```

Then, in truffle environment, we could call `printLogs()` function to print out event logs:


```
const { printLogs } = require('./test/utils/index.js')
const Foo = artifacts.require('./Foo.sol')

// Assuming inside an async function...
const { logs } = await Foo.foo(1)
printLogs(logs)
```

It is indeed a lot of work just to print stuff out, but this is what we can do at the moment.

### Debug in truffle console

If we know the transaction hash, we can leverage the integrated [console](https://truffleframework.com/docs/truffle/getting-started/using-truffle-develop-and-the-console) to easily execute commands and debug issues:

```
npx truffle console

# Then you can call truffle commands directly
truffle(development)> compile
truffle(development)> migrate
truffle(development)> test
truffle(development)> debug <transaction-hash>

# We also have access to the JavaScript environment
truffle(development)> await DepositManager.isDeployed()
truffle(development)> true
```

## Test

To run all tests under `test/` folder:

```
npx truffle test
```

To run some specific tests:

```
npx truffle test <test_file>
```

Notice that `arc unit` will be executed in the `arc diff` process, which will run all the truffle tests for us.

## Deployment

**WARNING: current deployment strategy is still highly experienmental and immature.**

Because deployed contracts are final, we always deploy fresh new contracts to the testnet and setup test environment from scratch. We may change our deployment strategy once we figure out how to upgrade existing contracts. 

### Rinkeby testnet

First, fill in the infura projectId and mnemonic in `config.js`.

Deploy new contracts to rinkeby testnet:

```
npx truffle migrate --network rinkeby --reset
```

Setup initial state for the test environment:

```
./scripts/bash/setupEnvironment rinkeby
```

Since contract ABIs have been changed, we need to redeploy web app following the same section in client's README. 
