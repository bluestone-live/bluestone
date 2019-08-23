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

    /// This struct is used internally in the `loanFromPoolGroups` function to avoid
    /// "CompilerError: Stack too deep, try removing local variables"
    struct LoanFromPoolGroupsLocalVars {
        uint8 loanTerm;
        address loanAsset;
        uint loanAmount;
        uint loanInterest;
        uint8 depositTerm;
    }

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
        LoanFromPoolGroupsLocalVars memory localVars;
        localVars.loanTerm = currLoan.term();
        localVars.loanAsset = currLoan.loanAsset();
        localVars.loanAmount = currLoan.loanAmount();
        uint loanableAmountFromAllPoolGroups;
        uint numAvailablePoolGroups;

        // Calculate total loanable amount from available pool groups
        for (uint i = 0; i < depositTerms.length; i++) {
            localVars.depositTerm = depositTerms[i];

            if (localVars.loanTerm > localVars.depositTerm) {
                continue;
            }

            uint loanableAmountFromThisPoolGroup = poolGroups[localVars.loanAsset][localVars.depositTerm]
                .totalLoanableAmountPerTerm(localVars.loanTerm);
            loanableAmountFromAllPoolGroups = loanableAmountFromAllPoolGroups.add(loanableAmountFromThisPoolGroup);
            numAvailablePoolGroups++;
        }

        // Check if we have sufficient amount to lend out
        require(localVars.loanAmount <= loanableAmountFromAllPoolGroups, "Insufficient amount for loan");

        uint remainingLoanAmount = localVars.loanAmount;

        // Loan from available pool groups
        for (uint i = 0; i < depositTerms.length; i++) {
            localVars.depositTerm = depositTerms[i];

            if (localVars.loanTerm > localVars.depositTerm) {
                continue;
            }

            if (numAvailablePoolGroups == 1) {
                // This is the last pool group left, so loan the remaining amount from it
                _loanFromPoolGroup(remainingLoanAmount, localVars.depositTerm, currLoan, loanTerms);
                break;
            }

            uint loanableAmountFromThisPoolGroup = poolGroups[localVars.loanAsset][localVars.depositTerm]
                .totalLoanableAmountPerTerm(localVars.loanTerm);

            // Calculate amount to be loaned from this pool group, proportionally to its totalLoanableAmountPerTerm
            uint loanAmountFromThisPoolGroup = localVars.loanAmount
                .mulFixed(loanableAmountFromThisPoolGroup) 
                .divFixed(loanableAmountFromAllPoolGroups);

            /// If there is non-zero remainder for the above calculation, it means we have precision-loss after 
            /// 18 decimal places. So loaners will receive loan amount less than what they asked for.
            /// We fix this issue in the next step.
            uint remainder = localVars.loanAmount
                .mulFixed(loanableAmountFromThisPoolGroup)
                .mod(loanableAmountFromAllPoolGroups);

            if (remainder > 0) {
                /// Compensate the precision-loss by adding one (wei) to the loan amount. If the result exceeds the
                /// maximum amount this pool group can provide, we take full loanable amount from this pool group.
                /// This strategy fixes the precision-loss issue while prevents overdraw from any pool group.
                loanAmountFromThisPoolGroup = Math.min(
                    loanAmountFromThisPoolGroup.add(1), 
                    loanableAmountFromThisPoolGroup
                );
            }

            _loanFromPoolGroup(loanAmountFromThisPoolGroup, localVars.depositTerm, currLoan, loanTerms);
            remainingLoanAmount = remainingLoanAmount.sub(loanAmountFromThisPoolGroup);
            numAvailablePoolGroups--;
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

    function updatePoolGroupDepositMaturity(address asset, uint8 depositTerm, uint8[] calldata loanTerms) external {
        require(_config.isUserActionsLocked(), "user actions need be locked before update maturity");
        PoolGroup poolGroup = poolGroups[asset][depositTerm];
        uint8 index = 0;

        // 1. Clear matured deposit from the 1-day pool
        poolGroup.clearDepositFromPool(index);

        // 2. Clear loan interest accumulated during the entire deposit term
        poolGroup.clearLoanInterestFromPool(index);

        /// 3. For every loan term N <= current deposit term, subtract N-th pool's loanableAmount from 
        /// totalLoanableAmountPerTerm since that amount will not be available after shifting pools.
        for (uint i = 0; i < loanTerms.length; i++) {
            if (loanTerms[i] <= depositTerm) {
                uint loanableAmountOfPool = poolGroup.getLoanableAmountFromPool(loanTerms[i] - 1);
                poolGroup.subtractTotalLoanableAmountPerTerm(loanTerms[i], loanableAmountOfPool);
            }
        }

        // 4. Update pool IDs to reflect the deposit maturity change
        poolGroup.updatePoolIds();
    }

    // Update totalLoanableAmountPerTerm for all pool groups of a deposit asset
    function updateTotalLoanableAmountPerTerm(address depositAsset, uint8[] calldata depositTerms, uint8 loanTerm) external {
        for (uint i = 0; i < depositTerms.length; i++) {
            uint8 depositTerm = depositTerms[i];
            PoolGroup poolGroup = poolGroups[depositAsset][depositTerm];
            uint totalLoanableAmount;

            // Add up loanableAmount from pools
            for (uint8 j = loanTerm - 1; j < depositTerm; j++) {
                uint loanableAmountOfPool = poolGroup.getLoanableAmountFromPool(j);
                totalLoanableAmount = totalLoanableAmount.add(loanableAmountOfPool);
            }

            poolGroup.setTotalLoanableAmountPerTerm(loanTerm, totalLoanableAmount);
        }
    }

    // INTERNAL

    /// Loan from pool on left-hand side, then right-hand side, move pointers towards middle
    /// and repeat until loan amount is fulfilled.
    /// 
    /// For example, 
    /// if loan term is 1 and deposit term is 7, the sequence is:
    /// 0, 6, 1, 5, 2, 4, 3
    ///
    /// if loan term is 7 and deposit term is 30, the sequence is:
    /// 6, 29, 7, 28, 8, 27, ..., 16, 19, 17, 18
    function _loanFromPoolGroup(
        uint loanAmount,
        uint8 depositTerm,
        Loan currLoan,
        uint8[] memory loanTerms
    ) 
        internal 
    {
        LoanFromPoolGroupsLocalVars memory localVars;
        localVars.loanAsset = currLoan.loanAsset();
        localVars.loanTerm = currLoan.term();
        localVars.loanAmount = currLoan.loanAmount();
        localVars.loanInterest = currLoan.interest();
        uint remainingLoanAmount = localVars.loanAmount;

        PoolGroup poolGroup = poolGroups[localVars.loanAsset][depositTerm];
        
        // Mark left, right and current pool index 
        uint8 left = localVars.loanTerm - 1;
        uint8 right = depositTerm - 1;
        uint8 poolIndex = left;
        bool onLeftSide = true;

        while (remainingLoanAmount > 0 && left <= right) {
            uint loanableAmount = poolGroup.getLoanableAmountFromPool(poolIndex);

            if (loanableAmount > 0) {
                uint loanAmountFromPool = Math.min(remainingLoanAmount, loanableAmount);
                uint loanInterestToPool = localVars.loanInterest
                    .mulFixed(loanAmountFromPool)
                    .divFixed(localVars.loanAmount);

                uint8 poolId = poolGroup.poolIds(poolIndex);

                poolGroup.loanFromPool(poolIndex, loanAmountFromPool, loanInterestToPool, localVars.loanTerm);

                // Record the actual pool we loan from, so we know which pool to repay back later
                currLoan.setRecord(depositTerm, poolId, loanAmountFromPool);

                remainingLoanAmount = remainingLoanAmount.sub(loanAmountFromPool);
            }

            // Switch side
            if (onLeftSide) {
                // In an odd-number pool group, we need to stop when we reach the last pool in the middle
                if (left == right) {
                    break;
                }

                poolIndex = right;
                onLeftSide = false;
            } else {
                // Update left and right pointers as both have been loaned
                left++;
                right--;

                poolIndex = left;
                onLeftSide = true;
            }
        }

        // Subtract loan amount from totalLoanableAmountPerTerm for every loan term <= this loan term
        for (uint i = 0; i < loanTerms.length; i++) {
            if (loanTerms[i] <= localVars.loanTerm) {
                poolGroup.subtractTotalLoanableAmountPerTerm(loanTerms[i], loanAmount);
            }
        }
    }

    // PRIVATE

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

            uint8 poolId = poolGroup.poolIds(poolIndex);
            uint loanAmount = currLoan.getRecord(depositTerm, poolId);

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
