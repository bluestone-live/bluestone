## Contracts

This directory contains smart contracts written in [Solidity](https://solidity.readthedocs.io/en/latest/). 

### Current state

The core functionalities are in place and unit tested (happy path) in local, but it should not be considered complete at this moment. Further work is needed to test, add missing features, improve the architecture and optimize gas usage. More specifically, the following things are missing:

- Solidity Events
- Error handling and error code
- Comprehensive input validation
- Robust `PriceOracle`

We are currently focused on building user interface to interact with these contracts using `web3` and `MetaMask`.

### Overview

We have two main deployed contracts which user can interact with: `DepositManager` and `LoanManager`. Each manager exposes external function calls related to its domain, i.e., deposit or loan, for end-users and admin. 

Here is a list of deployed contract dependencies for both managers to initialize:

- `Configuration`: sets and retrives business configurations.
- `PriceOracle`: sets token prices submitted by a poster.
- `TokenManager`: transfers tokens between protocol account (this contract) and customer account.
- `LiquidityPools`: stores `PoolGroup` instances, where each holds deposit and loan information for a specific token asset with a specific term.

To further understand the codebase, please start from `DepositManager` and `LoanManager`. See individual contract files for detailed documentation.

### Mocks

There are some contracts in `mocks/` directory, which is solely used for testing.
