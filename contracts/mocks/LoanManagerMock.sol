pragma solidity ^0.5.0;

import '../LoanManager.sol';
import '../Loan.sol';

contract LoanManagerMock is LoanManager {
    Loan[] public loans;

    function loan(
        uint256 term,
        address loanAsset,
        address collateralAsset,
        uint256 loanAmount,
        uint256 collateralAmount,
        bool useFreedCollateral
    ) public returns (Loan) {
        Loan currLoan = super.loan(
            term,
            loanAsset,
            collateralAsset,
            loanAmount,
            collateralAmount,
            useFreedCollateral
        );

        loans.push(currLoan);

        return currLoan;
    }
}
