pragma solidity ^0.5.0;

import '../LiquidityPools.sol';

contract LiquidityPoolsMock is LiquidityPools {
    constructor(Configuration config) public LiquidityPools(config) {}

    function loanFromPoolGroup(
        uint256 loanAmount,
        uint256 depositTerm,
        Loan currLoan,
        uint256[] calldata loanTerms
    ) external {
        super._loanFromPoolGroup(loanAmount, depositTerm, currLoan, loanTerms);
    }
}
