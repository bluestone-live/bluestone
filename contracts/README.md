# Contracts

This directory contains smart contracts written in [Solidity](https://solidity.readthedocs.io/en/latest/).

## Overview

We have one main deployed contract which user can interact with: `protocol/Protocol.sol`. It provides interfaces for the public to interact with our contracts. Actual business logic is delegated to these individual libraries:

- `protocol/lib/Configuration`: sets and retrives business configurations.
- `protocol/lib/LiquidityPools`: stores pool instances and contains fund-matching logic.
- `protocol/lib/DepositManager`: manages everything related to deposit.
- `protocol/lib/LoanManager`: manages everything related to loan.

To further understand the codebase, please start from `protocol/Protocol.sol` and explore interested contracts for more details.
