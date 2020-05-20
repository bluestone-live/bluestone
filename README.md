# BlueStone

BlueStone is a decentralized banking protocol on Ethereum blockchain. It provides a set of banking services, including deposit, borrow and liquidation of ETH and supported ERC20 tokens.

Read [Design Paper](https://github.com/bluestone-live/design-paper/blob/master/BlueStone%20Protocol.pdf) for more technical details.

## Project structure

The project is bootstrapped by [Truffle](https://github.com/trufflesuite/truffle).

- `arcanist-extensions/`: Custom PHP extensions written for [arcanist](https://secure.phabricator.com/book/phabricator/article/arcanist/).
- `client/`: Web client.
- `config/`: Configuration files following [node-config](https://github.com/lorenwest/node-config/wiki/Configuration-Files) conventions.
- `contracts/`: Smart contracts.
- `networks/`: Contains deployed contract and token addresses.
- `scripts/`: Scripts for smart contract interaction and common tasks.
- `test/`: Test files.

More details may be presented in individual folder's README.

## Prerequisite

Install the following tools:

- [Git](https://git-scm.com/downloads)
- [Arcanist](https://secure.phabricator.com/book/phabricator/article/arcanist_quick_start/)
- [Yarn](https://yarnpkg.com/en/docs/install)

Make sure you have read through [Truffle Documentation](https://truffleframework.com/docs/truffle/overview).

## Development

Create a config file for local development:

```
cp config/development.js config/local.js
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

## Test

To run all tests:

```
npx truffle test
```

To run some specific tests under `test/` folder:

```
npx truffle test <test_file>
```

## Deployment

**WARNING: current deployment strategy is still highly experienmental and immature.**

Because deployed contracts are final, we always deploy fresh new contracts to the testnet and setup test environment from scratch.

### Testnet

First, fill in the mnemonic in `config/local.js`.

Deploy new contracts to the target testnet:

```
npx truffle migrate --network <testnet> --reset
```

Setup initial state for the test environment:

```
./scripts/bash/setupEnvironment <testnet>
```

Since contract ABIs have been changed, we need to redeploy web app following the same section in client's README.
