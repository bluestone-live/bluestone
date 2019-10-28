# BlueStone

BlueStone provides a set of banking services on Ethereum blockchain. This repository contains everything related to BlueStone: smart contracts, back-end services, web client and useful scripts.

## Prerequisite

Install the following tools:

- [Git](https://git-scm.com/downloads)
- [Arcanist](https://secure.phabricator.com/book/phabricator/article/arcanist_quick_start/)
- [Yarn](https://yarnpkg.com/en/docs/install)

Make sure you have read through [Truffle Documentation](https://truffleframework.com/docs/truffle/overview).

## Setup your environment

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

Start Ethereum RPC client [ganache-cli](https://github.com/trufflesuite/ganache-cli):

```
yarn run start:ganache
```

Prepare test environment for local development:

```
./scripts/bash/setupEnvironment
```

## Project structure

- `arcanist-extensions/`: Custom PHP extensions written for arcanist.
- `contracts/`: Smart contracts written in Solidity.
- `libs/`: Common libraries.
- `migrations/`: Truffle migrations. Each file will be ran in sequence on `npx truffle migrate` and corresponding contracts will be deployed.
- `scripts/`: Scripts to interact with smart contracts and run common tasks.
- `server/`: Everything related to a web server.
- `test/`: All test files go to this directory.
- `clients/`: All user interfaces using in React, Mobx and TypeScript.

More details may be presented in individual folder's README.

## Development

Read [here](https://phabricator.bluestone.live/w/workflow/) for general development workflow.

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
