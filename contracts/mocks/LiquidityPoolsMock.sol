pragma solidity ^0.5.0;

import "../LiquidityPools.sol";


contract LiquidityPoolsMock is LiquidityPools {
    constructor(Configuration config) LiquidityPools(config) public {}

    function loanFromPoolGroup(
        uint loanAmount,
        uint depositTerm,
        Loan currLoan,
        uint[] calldata loanTerms
    )
        external
    {
        super._loanFromPoolGroup(loanAmount, depositTerm, currLoan, loanTerms);
    }
}
