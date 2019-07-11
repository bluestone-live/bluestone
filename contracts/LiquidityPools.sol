pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "./FixedMath.sol";
import "./Configuration.sol";
import "./PoolGroup.sol";
import "./Loan.sol";


/// Stores PoolGroup instances, where each holds deposit and loan information
/// of a specific asset with a specific term.
contract LiquidityPools {
    using SafeMath for uint;
    using FixedMath for uint;

    // asset -> term -> PoolGroup
    mapping(address => mapping(uint8 => PoolGroup)) public poolGroups;
    mapping(address => bool) public isPoolGroupsInitialized;

    Configuration private _config;

    constructor(Configuration config) public {
        _config = config;
    }

    function initPoolGroupsIfNeeded(address asset) external {
        if (!isPoolGroupsInitialized[asset]) {
            poolGroups[asset][1] = new PoolGroup(1);
            poolGroups[asset][7] = new PoolGroup(7);
            poolGroups[asset][30] = new PoolGroup(30);
            
            isPoolGroupsInitialized[asset] = true;
        }
    }

    function loanFromPoolGroup(
        address asset,
        uint8 depositTerm,
        uint8 loanTerm,
        uint loanAmount,
        Loan currLoan
    ) 
        external 
    {
        PoolGroup poolGroup = poolGroups[asset][depositTerm];
        uint coefficient = _config.getCoefficient(asset, depositTerm, loanTerm);
            
        // Calculate the total amount to be loaned from this pool group 
        uint remainingLoanAmount = coefficient.mulFixed(loanAmount);

        /// Assuming the calculated loan amount is always not more than the amount the 
        /// pool group can provide. TODO: add a check here just in case.

        uint8 poolIndex = loanTerm - 1;
        uint8 poolGroupLength = depositTerm;

        // Incrementing the pool group index and loaning from each pool until loan amount is fulfilled.
        while (remainingLoanAmount > 0 && poolIndex < poolGroupLength) {
            uint loanableAmount = poolGroup.getLoanableAmountFromPool(poolIndex);

            if (loanableAmount > 0) {
                uint loanedAmount = Math.min(remainingLoanAmount, loanableAmount);

                poolGroup.loanFromPool(poolIndex, loanedAmount, loanTerm);
                currLoan.setRecord(depositTerm, poolIndex, loanedAmount);
                remainingLoanAmount = remainingLoanAmount.sub(loanedAmount);
            }

            poolIndex++;
        }
    }

    function repayLoanToPoolGroup(address asset, uint8 depositTerm, uint totalRepayAmount, Loan currLoan) external {
        PoolGroup poolGroup = poolGroups[asset][depositTerm];

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
