# Free Banking

## Prerequisite

Install the following tools:

- [Mercurial](https://www.mercurial-scm.org/downloads)
- [Arcanist](https://secure.phabricator.com/book/phabricator/article/arcanist_quick_start/)
- [Yarn](https://yarnpkg.com/en/docs/install)
- [Ganache](https://truffleframework.com/ganache)

## Setup

```
yarn
npx truffle compile
npx truffle migrate
```

Make sure you have read through [Truffle Documentation](https://truffleframework.com/docs/truffle/overview).

## Development

Read [here](http://47.244.8.26/w/arcanist_workflow/) for general development workflow.

Since we've already installed Ganache as a client, we can leverage the integrated [console](https://truffleframework.com/docs/truffle/getting-started/using-truffle-develop-and-the-console) to easily execute commands and debug issues:

```bash
npx truffle console

# Then you can call truffle commands directly
truffle(development)> compile
truffle(development)> migrate
truffle(development)> test
truffle(development)> debug <transaction-hash>

# We also have access to the JavaScript environment
truffle(development)> await DepositMarket.isDeployed()
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
