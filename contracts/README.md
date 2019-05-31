## Contracts

This directory contains smart contracts written in [Solidity](https://solidity.readthedocs.io/en/latest/).

### Deployed Contracts

Here is a list of contracts which will be deployed to the Ethereum network:

- DepositManager: handles everything related to deposit and exposes public function calls for end-users and admin.
- LoanManager: handles everything related to loan and exposes public function calls for end-users and admin.
- Configuration: stores and retrives business configurations.
- PriceOracle: stores token prices submitted by a poster.
- TokenManager: transfers tokens between protocol and customers.
- LiquidityPools: stores `PoolGroup` instance for each asset and term.

### Mocks

There are some contracts in `mocks/` directory, which is solely used for testing.
