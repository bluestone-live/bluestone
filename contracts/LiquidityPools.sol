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
            poolGroups[asset][30] = new PoolGroup(30);
            
            isPoolGroupsInitialized[asset] = true;
        }
    }

    function loanFromPoolGroup(
        uint8 depositTerm,
        Loan currLoan
    ) 
        external 
    {
        address asset = currLoan.loanAsset();
        uint8 loanTerm = currLoan.term();
        uint loanAmount = currLoan.loanAmount();
        uint loanInterest = currLoan.interest();
        uint coefficient = _config.getCoefficient(asset, depositTerm, loanTerm);
            
        // Calculate the total amount to be loaned from this pool group 
        uint remainingLoanAmount = coefficient.mulFixed(loanAmount);

        /// Assuming the calculated loan amount is always not more than the amount the 
        /// pool group can provide. TODO: add a check here just in case.

        uint8 poolIndex = loanTerm - 1;
        uint8 poolGroupLength = depositTerm;
        PoolGroup poolGroup = poolGroups[asset][depositTerm];

        // Incrementing the pool group index and loaning from each pool until loan amount is fulfilled.
        while (remainingLoanAmount > 0 && poolIndex < poolGroupLength) {
            uint loanableAmount = poolGroup.getLoanableAmountFromPool(poolIndex);

            if (loanableAmount > 0) {
                uint loanAmountFromPool = Math.min(remainingLoanAmount, loanableAmount);
                uint loanInterestToPool = loanInterest.mulFixed(loanAmountFromPool).divFixed(loanAmount);

                poolGroup.loanFromPool(poolIndex, loanAmountFromPool, loanInterestToPool, loanTerm);
                currLoan.setRecord(depositTerm, poolIndex, loanAmountFromPool);
                remainingLoanAmount = remainingLoanAmount.sub(loanAmountFromPool);
            }

            poolIndex++;
        }
    }

    function repayLoanToPoolGroup(uint8 depositTerm, uint totalRepayAmount, Loan currLoan) external {
        address asset = currLoan.loanAsset();
        uint totalLoanAmount = currLoan.loanAmount();

        PoolGroup poolGroup = poolGroups[asset][depositTerm];
        uint remainingRepayAmount = totalRepayAmount;

        // Repay loan back to each pool, proportional to the total loan from all pools
        for (uint8 poolIndex = 0; poolIndex < depositTerm; poolIndex++) {
            if (remainingRepayAmount == 0) {
                // Stop loop when remaining repay amount used up
                break;
            }

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
            remainingRepayAmount = remainingRepayAmount - repayAmount;
        }
    }

    function updatePoolGroupDepositMaturity(address asset, uint8 depositTerm) external {
        PoolGroup poolGroup = poolGroups[asset][depositTerm];
        uint8 index = 0;
        uint oneTimeDeposit = poolGroup.getOneTimeDepositFromPool(index);

        // 1. Withdraw matured non-recurring deposit from the 1-day pool
        poolGroup.withdrawOneTimeDepositFromPool(index, oneTimeDeposit);

        // 2. Clear loan interest accumulated during the enture deposit term
        poolGroup.clearLoanInterestFromPool(index);

        // 3. Update pool IDs to reflect the deposit maturity change
        poolGroup.updatePoolIds();
    }
}
