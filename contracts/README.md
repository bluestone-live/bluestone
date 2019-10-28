## Contracts

This directory contains smart contracts written in [Solidity](https://solidity.readthedocs.io/en/latest/).

Notice that the `_refactor` folder contains the latest contract code to address the first round of auditing feedback. Old code will be removed shortly.

### Current state

Core functionalities have been implemented and unit tested, but further work is needed to test and optimize gas usage. We are working with our auditing team to ensure the security and quality of our contracts.

### Overview

We have one main deployed contract which user can interact with: `Protocol`. It provides interfaces for the public to interact with our contracts. Actual business logic is delegated to these individual libraries:

- `Configuration`: sets and retrives business configurations.
- `LiquidityPools`: stores pool instances and contains fund-matching logic.
- `DepositManager`: manages everything related to deposit.
- `LoanManager`: manages everything related to loan.

To further understand the codebase, please start from `Protocol` and explore interested contracts for more details.

### Mocks

There are some contracts in `mocks/` directory, which is solely used for testing.
