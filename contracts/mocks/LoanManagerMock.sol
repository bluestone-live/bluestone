pragma solidity ^0.5.0;

import "../Configuration.sol";
import "../PriceOracle.sol";
import "../TokenManager.sol";
import "../LiquidityPools.sol";
import "../DepositManager.sol";
import "../LoanManager.sol";
import "../Loan.sol";
import "../AccountManager.sol";


contract LoanManagerMock is LoanManager {
    Loan[] public loans;

    constructor(
        Configuration config,
        PriceOracle priceOracle,
        TokenManager tokenManager,
        LiquidityPools liquidityPools,
        DepositManager depositManager,
        AccountManager accountManager
    ) 
        LoanManager(config, priceOracle, tokenManager, liquidityPools, depositManager, accountManager)
        public 
        {
            super.addLoanTerm(7);
            super.addLoanTerm(30);
        }

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
