pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "./FixedMath.sol";
import "./Configuration.sol";
import "./PoolGroup.sol";
import "./Deposit.sol";
import "./Loan.sol";


/// Stores PoolGroup instances, where each holds deposit and loan information
/// of a specific asset with a specific term.
contract LiquidityPools {
    using SafeMath for uint;
    using FixedMath for uint;

    // asset -> term -> PoolGroup
    mapping(address => mapping(uint8 => PoolGroup)) public poolGroups;

    Configuration private _config;

    constructor(Configuration config) public {
        _config = config;
    }

    function initPoolGroupIfNeeded(address asset, uint8 depositTerm) public {
        if (address(poolGroups[asset][depositTerm]) == address(0)) {
            poolGroups[asset][depositTerm] = new PoolGroup(depositTerm);
        }
    }

    function addDepositToPoolGroup(Deposit currDeposit, uint8[] calldata loanTerms) external {
        address asset = currDeposit.asset();
        uint8 depositTerm = currDeposit.term();
        uint amount = currDeposit.amount();

        PoolGroup poolGroup = poolGroups[asset][depositTerm];
        uint8 lastPoolIndex = depositTerm - 1;

        poolGroup.addDepositToPool(lastPoolIndex, amount);

        // Add deposit amount to totalLoanableAmountPerTerm for every loan term <= this deposit term
        for (uint i = 0; i < loanTerms.length; i++) {
            if (loanTerms[i] <= depositTerm) {
                poolGroup.addTotalLoanableAmountPerTerm(loanTerms[i], amount);
            }
        }
    }

    function loanFromPoolGroups(Loan currLoan, uint8[] calldata depositTerms, uint8[] calldata loanTerms) external {
        uint loanTerm = currLoan.term();

        for (uint i = 0; i < depositTerms.length; i++) {
            uint8 depositTerm = depositTerms[i];

            if (loanTerm <= depositTerm) {
                _loanFromPoolGroup(depositTerm, currLoan, loanTerms);
            }
        }
    }

    function repayLoanToPoolGroups(
        uint totalRepayAmount, 
        Loan currLoan, 
        uint8[] calldata depositTerms, 
        uint8[] calldata loanTerms
    ) 
        external 
    {
        uint loanTerm = currLoan.term();

        for (uint i = 0; i < depositTerms.length; i++) {
            uint8 depositTerm = depositTerms[i];

            if (loanTerm <= depositTerm) {
                _repayLoanToPoolGroup(depositTerm, totalRepayAmount, currLoan, loanTerms);
            }
        }
    }

    function updatePoolGroupDepositMaturity(address asset, uint8 depositTerm) external {
        require(_config.isUserActionsLocked(), "user actions need be locked before update maturity");
        PoolGroup poolGroup = poolGroups[asset][depositTerm];
        uint8 index = 0;

        // 1. Clear matured deposit from the 1-day pool
        poolGroup.clearDepositFromPool(index);

        // 2. Clear loan interest accumulated during the enture deposit term
        poolGroup.clearLoanInterestFromPool(index);

        // 3. Update pool IDs to reflect the deposit maturity change
        poolGroup.updatePoolIds();
    }

    // PRIVATE

    function _loanFromPoolGroup(
        uint8 depositTerm,
        Loan currLoan,
        uint8[] memory loanTerms
    ) 
        private 
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
        PoolGroup poolGroup = poolGroups[asset][depositTerm];

        // Incrementing the pool group index and loaning from each pool until loan amount is fulfilled.
        while (remainingLoanAmount > 0 && poolIndex < depositTerm) {
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

        // Subtract loan amount from totalLoanableAmountPerTerm for every loan term <= this loan term
        for (uint i = 0; i < loanTerms.length; i++) {
            if (loanTerms[i] <= loanTerm) {
                poolGroup.subtractTotalLoanableAmountPerTerm(loanTerms[i], loanAmount);
            }
        }
    }

    function _repayLoanToPoolGroup(
        uint8 depositTerm, 
        uint totalRepayAmount, 
        Loan currLoan, 
        uint8[] memory loanTerms
    ) 
        private 
    {
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

            // Add repay amount to totalLoanableAmountPerTerm for every loan term <= current term the pool refers to
            for (uint i = 0; i < loanTerms.length; i++) {
                if (loanTerms[i] <= poolIndex + 1) {
                    poolGroup.addTotalLoanableAmountPerTerm(loanTerms[i], repayAmount);
                }
            }
        }
    }
}
