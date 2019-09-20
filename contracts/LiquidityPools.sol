pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/math/Math.sol';
import './FixedMath.sol';
import './Configuration.sol';
import './PoolGroup.sol';
import './Deposit.sol';
import './Loan.sol';

/// Stores PoolGroup instances, where each holds deposit and loan information
/// of a specific asset with a specific term.
contract LiquidityPools {
    using SafeMath for uint256;
    using FixedMath for uint256;

    /// This struct is used internally in the `loanFromPoolGroups` function to avoid
    /// "CompilerError: Stack too deep, try removing local variables"
    struct LoanFromPoolGroupsLocalVars {
        uint256 loanTerm;
        address loanAsset;
        uint256 loanAmount;
        uint256 loanInterest;
        uint256 depositTerm;
    }

    // asset -> term -> PoolGroup
    mapping(address => mapping(uint256 => PoolGroup)) public poolGroups;

    Configuration private _config;

    constructor(Configuration config) public {
        _config = config;
    }

    function initPoolGroupIfNeeded(address asset, uint256 depositTerm) public {
        if (address(poolGroups[asset][depositTerm]) == address(0)) {
            poolGroups[asset][depositTerm] = new PoolGroup(depositTerm);
        }
    }

    function addDepositToPoolGroup(
        Deposit currDeposit,
        uint256[] calldata loanTerms
    ) external {
        address asset = currDeposit.asset();
        uint256 depositTerm = currDeposit.term();
        uint256 amount = currDeposit.amount();

        PoolGroup poolGroup = poolGroups[asset][depositTerm];
        uint256 lastPoolIndex = depositTerm - 1;

        poolGroup.addDepositToPool(lastPoolIndex, amount);

        // Add deposit amount to totalLoanableAmountPerTerm for every loan term <= this deposit term
        for (uint256 i = 0; i < loanTerms.length; i++) {
            if (loanTerms[i] <= depositTerm) {
                poolGroup.addTotalLoanableAmountPerTerm(loanTerms[i], amount);
            }
        }
    }

    function subDepositFromPoolGroup(
        Deposit currDeposit,
        uint256[] calldata loanTerms
    ) external {
        address asset = currDeposit.asset();
        uint256 depositTerm = currDeposit.term();
        uint256 amount = currDeposit.amount();
        uint256 poolId = currDeposit.poolId();

        PoolGroup poolGroup = poolGroups[asset][depositTerm];
        uint256 daysBeforeMaturity = depositTerm -
            poolGroup.getDaysAfterDepositCreation(poolId);
        poolGroup.subDepositFromPool(currDeposit.poolId(), amount);

        for (uint256 i = 0; i < loanTerms.length; i++) {
            if (loanTerms[i] <= daysBeforeMaturity) {
                poolGroup.subtractTotalLoanableAmountPerTerm(
                    loanTerms[i],
                    amount
                );
            }
        }
    }

    function loanFromPoolGroups(
        Loan currLoan,
        uint256[] calldata depositTerms,
        uint256[] calldata loanTerms
    ) external {
        LoanFromPoolGroupsLocalVars memory localVars;
        localVars.loanTerm = currLoan.term();
        localVars.loanAsset = currLoan.loanAsset();
        localVars.loanAmount = currLoan.loanAmount();
        uint256 loanableAmountFromAllPoolGroups;
        uint256 numAvailablePoolGroups;

        // Calculate total loanable amount from available pool groups
        for (uint256 i = 0; i < depositTerms.length; i++) {
            localVars.depositTerm = depositTerms[i];

            if (localVars.loanTerm > localVars.depositTerm) {
                continue;
            }

            uint256 loanableAmountFromThisPoolGroup = poolGroups[localVars
                .loanAsset][localVars.depositTerm]
                .totalLoanableAmountPerTerm(localVars.loanTerm);
            loanableAmountFromAllPoolGroups = loanableAmountFromAllPoolGroups
                .add(loanableAmountFromThisPoolGroup);
            numAvailablePoolGroups++;
        }

        // Check if we have sufficient amount to lend out
        require(
            localVars.loanAmount <= loanableAmountFromAllPoolGroups,
            'Insufficient amount for loan'
        );

        uint256 remainingLoanAmount = localVars.loanAmount;

        // Loan from available pool groups
        for (uint256 i = 0; i < depositTerms.length; i++) {
            localVars.depositTerm = depositTerms[i];

            if (localVars.loanTerm > localVars.depositTerm) {
                continue;
            }

            if (numAvailablePoolGroups == 1) {
                // This is the last pool group left, so loan the remaining amount from it
                _loanFromPoolGroup(
                    remainingLoanAmount,
                    localVars.depositTerm,
                    currLoan,
                    loanTerms
                );
                break;
            }

            uint256 loanableAmountFromThisPoolGroup = poolGroups[localVars
                .loanAsset][localVars.depositTerm]
                .totalLoanableAmountPerTerm(localVars.loanTerm);

            // Calculate amount to be loaned from this pool group, proportionally to its totalLoanableAmountPerTerm
            uint256 loanAmountFromThisPoolGroup = localVars
                .loanAmount
                .mulFixed(loanableAmountFromThisPoolGroup)
                .divFixed(loanableAmountFromAllPoolGroups);

            /// If there is non-zero remainder for the above calculation, it means we have precision-loss after
            /// 18 decimal places. So loaners will receive loan amount less than what they asked for.
            /// We fix this issue in the next step.
            uint256 remainder = localVars
                .loanAmount
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

            _loanFromPoolGroup(
                loanAmountFromThisPoolGroup,
                localVars.depositTerm,
                currLoan,
                loanTerms
            );
            remainingLoanAmount = remainingLoanAmount.sub(
                loanAmountFromThisPoolGroup
            );
            numAvailablePoolGroups--;
        }
    }

    function repayLoanToPoolGroups(
        uint256 totalRepayAmount,
        Loan currLoan,
        uint256[] calldata depositTerms,
        uint256[] calldata loanTerms
    ) external {
        uint256 loanTerm = currLoan.term();

        for (uint256 i = 0; i < depositTerms.length; i++) {
            uint256 depositTerm = depositTerms[i];

            if (loanTerm <= depositTerm) {
                _repayLoanToPoolGroup(
                    depositTerm,
                    totalRepayAmount,
                    currLoan,
                    loanTerms
                );
            }
        }
    }

    function updatePoolGroupDepositMaturity(
        address asset,
        uint256 depositTerm,
        uint256[] calldata loanTerms
    ) external {
        require(
            _config.isUserActionsLocked(),
            'user actions need be locked before update maturity'
        );
        PoolGroup poolGroup = poolGroups[asset][depositTerm];
        uint256 index = 0;

        // 1. Clear matured deposit from the 1-day pool
        poolGroup.clearDepositFromPool(index);

        // 2. Clear loan interest accumulated during the entire deposit term
        poolGroup.clearLoanInterestFromPool(index);

        /// 3. For every loan term N <= current deposit term, subtract N-th pool's loanableAmount from
        /// totalLoanableAmountPerTerm since that amount will not be available after shifting pools.
        for (uint256 i = 0; i < loanTerms.length; i++) {
            if (loanTerms[i] <= depositTerm) {
                uint256 loanableAmountOfPool = poolGroup
                    .getLoanableAmountFromPool(loanTerms[i] - 1);
                poolGroup.subtractTotalLoanableAmountPerTerm(
                    loanTerms[i],
                    loanableAmountOfPool
                );
            }
        }

        // 4. Update pool IDs to reflect the deposit maturity change
        poolGroup.updatePoolIds();
    }

    // Update totalLoanableAmountPerTerm for all pool groups of a deposit asset
    function updateTotalLoanableAmountPerTerm(
        address depositAsset,
        uint256[] calldata depositTerms,
        uint256 loanTerm
    ) external {
        for (uint256 i = 0; i < depositTerms.length; i++) {
            uint256 depositTerm = depositTerms[i];
            PoolGroup poolGroup = poolGroups[depositAsset][depositTerm];
            uint256 totalLoanableAmount;

            // Add up loanableAmount from pools
            for (uint256 j = loanTerm - 1; j < depositTerm; j++) {
                uint256 loanableAmountOfPool = poolGroup
                    .getLoanableAmountFromPool(j);
                totalLoanableAmount = totalLoanableAmount.add(
                    loanableAmountOfPool
                );
            }

            poolGroup.setTotalLoanableAmountPerTerm(
                loanTerm,
                totalLoanableAmount
            );
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
        uint256 loanAmount,
        uint256 depositTerm,
        Loan currLoan,
        uint256[] memory loanTerms
    ) internal {
        LoanFromPoolGroupsLocalVars memory localVars;
        localVars.loanAsset = currLoan.loanAsset();
        localVars.loanTerm = currLoan.term();
        localVars.loanAmount = currLoan.loanAmount();
        localVars.loanInterest = currLoan.interest();
        uint256 remainingLoanAmount = localVars.loanAmount;

        PoolGroup poolGroup = poolGroups[localVars.loanAsset][depositTerm];

        // Mark left, right and current pool index
        uint256 left = localVars.loanTerm - 1;
        uint256 right = depositTerm - 1;
        uint256 poolIndex = left;
        bool onLeftSide = true;

        while (remainingLoanAmount > 0 && left <= right) {
            uint256 loanableAmount = poolGroup.getLoanableAmountFromPool(
                poolIndex
            );

            if (loanableAmount > 0) {
                uint256 loanAmountFromPool = Math.min(
                    remainingLoanAmount,
                    loanableAmount
                );
                uint256 loanInterestToPool = localVars
                    .loanInterest
                    .mulFixed(loanAmountFromPool)
                    .divFixed(localVars.loanAmount);

                uint256 poolId = poolGroup.poolIds(poolIndex);

                poolGroup.loanFromPool(
                    poolIndex,
                    loanAmountFromPool,
                    loanInterestToPool,
                    localVars.loanTerm
                );

                // Record the actual pool we loan from, so we know which pool to repay back later
                currLoan.setRecord(depositTerm, poolId, loanAmountFromPool);

                remainingLoanAmount = remainingLoanAmount.sub(
                    loanAmountFromPool
                );
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
        for (uint256 i = 0; i < loanTerms.length; i++) {
            if (loanTerms[i] <= localVars.loanTerm) {
                poolGroup.subtractTotalLoanableAmountPerTerm(
                    loanTerms[i],
                    loanAmount
                );
            }
        }
    }

    // PRIVATE

    function _repayLoanToPoolGroup(
        uint256 depositTerm,
        uint256 totalRepayAmount,
        Loan currLoan,
        uint256[] memory loanTerms
    ) private {
        address asset = currLoan.loanAsset();
        uint256 totalLoanAmount = currLoan.loanAmount();

        PoolGroup poolGroup = poolGroups[asset][depositTerm];
        uint256 remainingRepayAmount = totalRepayAmount;

        // Repay loan back to each pool, proportional to the total loan from all pools
        for (uint256 poolIndex = 0; poolIndex < depositTerm; poolIndex++) {
            if (remainingRepayAmount == 0) {
                // Stop loop when remaining repay amount used up
                break;
            }

            uint256 poolId = poolGroup.poolIds(poolIndex);
            uint256 loanAmount = currLoan.getRecord(depositTerm, poolId);

            if (loanAmount == 0) {
                // Skip this pool since it has no loan
                continue;
            }

            /// Calculate the amount to repay to this pool, e.g., if I loaned total of 100
            /// from all pools, where 10 is from this pool, and I want to repay 50 now.
            /// Then the amount pay back to this pool will be: 50 * 10 / 100 = 5
            uint256 repayAmount = totalRepayAmount
                .mulFixed(loanAmount)
                .divFixed(totalLoanAmount);
            poolGroup.repayLoanToPool(poolIndex, repayAmount, currLoan.term());
            remainingRepayAmount = remainingRepayAmount - repayAmount;

            // Add repay amount to totalLoanableAmountPerTerm for every loan term <= current term the pool refers to
            for (uint256 i = 0; i < loanTerms.length; i++) {
                if (loanTerms[i] <= poolIndex + 1) {
                    poolGroup.addTotalLoanableAmountPerTerm(
                        loanTerms[i],
                        repayAmount
                    );
                }
            }
        }
    }
}
