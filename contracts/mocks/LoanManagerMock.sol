pragma solidity ^0.5.0;

import "../LoanManager.sol";


contract LoanManagerMock is LoanManager {
    bytes32[] public loanIds;

    constructor(
        address config,
        address priceOracle,
        address tokenManager,
        address liquidityPools,
        address depositManager
    ) 
        LoanManager(config, priceOracle, tokenManager, liquidityPools, depositManager)
        public 
    {}

    function loan(
        uint8 term,
        address loanAsset, 
        address collateralAsset,
        uint loanAmount,
        uint collateralAmount,
        uint requestedFreedCollateral
    ) 
        public returns (bytes32) 
    {
        bytes32 loanId = super.loan(
            term,
            loanAsset,
            collateralAsset,
            loanAmount,
            collateralAmount,
            requestedFreedCollateral
        );

        loanIds.push(loanId);

        return loanId;
    }
}
