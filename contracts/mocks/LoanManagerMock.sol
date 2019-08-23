pragma solidity ^0.5.0;

import "../LoanManager.sol";
import "../Loan.sol";


contract LoanManagerMock is LoanManager {
    Loan[] public loans;

    function loan(
        uint term,
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
