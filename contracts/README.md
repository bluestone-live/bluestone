## Contracts

This directory contains smart contracts written in [Solidity](https://solidity.readthedocs.io/en/latest/).

### Current state

Core functionalities have been implemented and unit tested, but further work is needed to test and optimize gas usage. We are working with our auditing team to ensure the security and quality of our contracts.

### Overview

We have one main deployed contract which user can interact with: `protocol/Protocol.sol`. It provides interfaces for the public to interact with our contracts. Actual business logic is delegated to these individual libraries:

- `Configuration`: sets and retrives business configurations.
- `LiquidityPools`: stores pool instances and contains fund-matching logic.
- `DepositManager`: manages everything related to deposit.
- `LoanManager`: manages everything related to loan.

To further understand the codebase, please start from `protocol/Protocol.sol` and explore interested contracts for more details.
