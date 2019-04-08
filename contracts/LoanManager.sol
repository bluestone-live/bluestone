pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./LiquidityPools.sol";
import "./PoolGroup.sol";
import "./FixedMath.sol";
import "./Configuration.sol";
import "./Loan.sol";


contract LoanManager {
    using SafeMath for uint;
    using FixedMath for uint;

    LiquidityPools private _liquidityPools;
    Configuration private _config;

    uint private _loanId;
    mapping(uint => Loan) private loans;

    constructor(LiquidityPools liquidityPools, address config) public {
        _liquidityPools = liquidityPools;
        _config = Configuration(config);
    }

    function loan(address user, uint8 loanTerm, uint loanAmount, uint collateralAmount) external {
        uint interestRate = _config.getLoanInterestRate(loanTerm);
        loans[_loanId] = new Loan(user, loanTerm, loanAmount, collateralAmount, interestRate);

        if (loanTerm == 1) {
            loanFromPoolGroup(1, loanTerm, loanAmount, _loanId);
            loanFromPoolGroup(7, loanTerm, loanAmount, _loanId);
            loanFromPoolGroup(30, loanTerm, loanAmount, _loanId);
        } else if (loanTerm == 3 || loanTerm == 7) {
            loanFromPoolGroup(7, loanTerm, loanAmount, _loanId);
            loanFromPoolGroup(30, loanTerm, loanAmount, _loanId);
        } else if (loanTerm == 30) {
            loanFromPoolGroup(30, loanTerm, loanAmount, _loanId);
        }

        _loanId++;
    }

    function addCollateral(address user, uint loanId, uint amount) external {
        require(user == loans[loanId].owner());

        loans[loanId].addCollateral(amount);
    }

    /// @param user The address of payer
    /// @param loanId ID to lookup the Loan
    /// @param amount The amount to repay (or -1 for max)
    function repayLoan(address user, uint loanId, uint amount) external returns (uint) {
        Loan currLoan = loans[loanId];
        require(user == currLoan.owner());

        // The amount of money, including accrued interest, waiting to be repaid to pools
        uint totalRepayAmount = currLoan.repay(amount);

        repayLoanToPoolGroup(30, totalRepayAmount, loanId);
        repayLoanToPoolGroup(7, totalRepayAmount, loanId);
        repayLoanToPoolGroup(1, totalRepayAmount, loanId);

        return totalRepayAmount;
    }

    function loanFromPoolGroup(uint8 depositTerm, uint8 loanTerm, uint loanAmount, uint loanId) private {
        PoolGroup poolGroup = _liquidityPools.poolGroups(depositTerm);
        uint coefficient = _config.getCoefficient(depositTerm, loanTerm);
            
        // Calculate the total amount to be loaned from this pool group 
        uint remainingLoanAmount = coefficient.mulFixed(loanAmount);

        /// Assuming the calculated loan amount is always not more than the amount the 
        /// pool group can provide. TODO: add a check here just in case.

        uint8 poolIndex = loanTerm - 1;
        uint8 poolGroupLength = depositTerm;

        /// Incrementing the pool group index and loaning from each pool until loan amount is fulfilled.
        while (remainingLoanAmount > 0 && poolIndex < poolGroupLength) {
            uint loanableAmount = poolGroup.getLoanableAmountFromPool(poolIndex);

            if (loanableAmount > 0) {
                uint loanedAmount = Math.min(remainingLoanAmount, loanableAmount);

                poolGroup.loanFromPool(poolIndex, loanedAmount, loanTerm);
                loans[loanId].setRecord(depositTerm, poolIndex, loanedAmount);
                remainingLoanAmount = remainingLoanAmount.sub(loanedAmount);
            }

            poolIndex++;
        }
    }

    function repayLoanToPoolGroup(uint8 depositTerm, uint totalRepayAmount, uint loanId) private returns (uint) {
        PoolGroup poolGroup = _liquidityPools.poolGroups(depositTerm);
        Loan currLoan = loans[loanId];

        uint totalLoanAmount = currLoan.loanAmount();

        // Repay loan back to each pool, proportional to the total loan from all pools
        for (uint8 poolIndex = 0; poolIndex < depositTerm; poolIndex++) {
            uint loanAmount = currLoan.getRecord(depositTerm, poolIndex);

            if (loanAmount == 0) {
                // Skip this pool since it has no loan
                continue;
            }

            /// Calculate the amount to repay to this pool, e.g., if I loaned total of 100
            /// from all pools, where 10 is from this pool, and I want to repay 50 now.
            /// Then the amount pay back to this pool will be: 50 * 10 / 100 = 5
            uint repayAmount = totalRepayAmount.mulFixed(loanAmount).divFixed(totalLoanAmount);
            poolGroup.repayLoanToPool(poolIndex, repayAmount, currLoan.term());
        }
    }
}
