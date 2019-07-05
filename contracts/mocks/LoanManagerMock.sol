pragma solidity ^0.5.0;

import "../Configuration.sol";
import "../PriceOracle.sol";
import "../TokenManager.sol";
import "../LiquidityPools.sol";
import "../DepositManager.sol";
import "../LoanManager.sol";
import "../Loan.sol";


contract LoanManagerMock is LoanManager {
    Loan[] public loans;

    constructor(
        Configuration config,
        PriceOracle priceOracle,
        TokenManager tokenManager,
        LiquidityPools liquidityPools,
        DepositManager depositManager
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
        public returns (Loan) 
    {
        Loan currLoan = super.loan(
            term,
            loanAsset,
            collateralAsset,
            loanAmount,
            collateralAmount,
            requestedFreedCollateral
        );

        loans.push(currLoan);

        return currLoan;
    }
}
