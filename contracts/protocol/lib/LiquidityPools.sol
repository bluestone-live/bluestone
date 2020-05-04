pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '../../common/lib/Math.sol';
import '../../common/lib/SafeMath.sol';
import '../../common/lib/FixedMath.sol';
import '../../common/lib/DateTime.sol';
import '../interface/IStruct.sol';
import './LoanManager.sol';


library LiquidityPools {
    using SafeMath for uint256;
    using FixedMath for uint256;

    struct State {
        // token -> PoolGroup
        mapping(address => PoolGroup) poolGroups;
        // Number of pools in a PoolGroup
        uint256 poolGroupSize;
    }

    struct PoolGroup {
        // Pool ID (in day) -> Pool
        mapping(uint256 => IStruct.Pool) poolsById;
        // Loan ID -> Pool ID -> Borrow amount
        mapping(bytes32 => mapping(uint256 => uint256)) loanAmountByLoanIdAndPoolId;
    }

    function setPoolGroupSize(State storage self, uint256 poolGroupSize)
        external
    {
        self.poolGroupSize = poolGroupSize;
    }

    function addDepositToPool(
        State storage self,
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        uint256 depositWeight,
        uint256 depositDistributorFeeRatio,
        uint256 loanDistributorFeeRatio,
        uint256 protocolReserveRatio
    ) external returns (uint256 poolId) {
        PoolGroup storage poolGroup = self.poolGroups[tokenAddress];
        poolId = DateTime.toDays().add(depositTerm);
        IStruct.Pool storage pool = poolGroup.poolsById[poolId];
        pool.depositAmount = pool.depositAmount.add(depositAmount);
        pool.availableAmount = pool.availableAmount.add(depositAmount);
        pool.totalDepositWeight = pool.totalDepositWeight.add(depositWeight);

        // Record ratios for interest disribution if they have not been set
        if (
            pool.depositDistributorFeeRatio == 0 &&
            pool.loanDistributorFeeRatio == 0 &&
            pool.protocolReserveRatio == 0
        ) {
            pool.depositDistributorFeeRatio = depositDistributorFeeRatio;
            pool.loanDistributorFeeRatio = loanDistributorFeeRatio;
            pool.protocolReserveRatio = protocolReserveRatio;
        }

        return poolId;
    }

    function subtractDepositFromPool(
        State storage self,
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositWeight,
        uint256 poolId
    ) external {
        PoolGroup storage poolGroup = self.poolGroups[tokenAddress];
        IStruct.Pool storage pool = poolGroup.poolsById[poolId];
        pool.depositAmount = pool.depositAmount.sub(depositAmount);
        pool.availableAmount = pool.availableAmount.sub(depositAmount);
        pool.totalDepositWeight = pool.totalDepositWeight.sub(depositWeight);
    }

    function loanFromPools(
        State storage self,
        IStruct.LoanRecord storage loanRecord
    ) external {
        PoolGroup storage poolGroup = self.poolGroups[loanRecord
            .loanTokenAddress];
        uint256 firstPoolId = DateTime.toDays();
        uint256 availableAmount;

        // Calculate available amount to borrow for the loan term
        for (
            uint256 poolId = firstPoolId.add(loanRecord.loanTerm);
            poolId <= firstPoolId.add(self.poolGroupSize);
            poolId = poolId.add(1)
        ) {
            availableAmount = availableAmount.add(
                poolGroup.poolsById[poolId].availableAmount
            );
        }

        uint256 remainingLoanAmount = loanRecord.loanAmount;

        require(
            availableAmount >= remainingLoanAmount,
            'LiquidityPools: invalid loan amount'
        );

        uint256 distributorInterest;

        for (
            uint256 poolId = firstPoolId.add(loanRecord.loanTerm);
            poolId <= firstPoolId.add(self.poolGroupSize);
            poolId = poolId.add(1)
        ) {
            if (remainingLoanAmount == 0) {
                break;
            }

            IStruct.Pool storage pool = poolGroup.poolsById[poolId];

            if (pool.availableAmount == 0) {
                continue;
            }

            uint256 loanAmountFromPool = Math.min(
                remainingLoanAmount,
                pool.availableAmount
            );

            uint256 loanInterestToPool = loanRecord
                .interest
                .mul(loanAmountFromPool)
                .div(loanRecord.loanAmount);

            uint256 distributorInterestFromPool = pool
                .loanDistributorFeeRatio
                .mulFixed(loanInterestToPool);

            pool.availableAmount = pool.availableAmount.sub(loanAmountFromPool);
            pool.loanInterest = pool.loanInterest.add(loanInterestToPool);

            // Add up interest for loan distributor
            distributorInterest = distributorInterest.add(
                distributorInterestFromPool
            );

            // Record the actual pool we loan from, so we know which pool to repay back later
            poolGroup.loanAmountByLoanIdAndPoolId[loanRecord
                .loanId][poolId] = loanAmountFromPool;

            remainingLoanAmount = remainingLoanAmount.sub(loanAmountFromPool);
        }

        // Save total loan distributor interest into loan record
        loanRecord.distributorInterest = distributorInterest;
    }

    function repayLoanToPools(
        State storage self,
        IStruct.LoanRecord storage loanRecord,
        uint256 repayAmount
    ) external {
        PoolGroup storage poolGroup = self.poolGroups[loanRecord
            .loanTokenAddress];

        uint256 remainingRepayAmount = repayAmount;
        uint256 firstPoolId = DateTime.toDays();

        // Repay loan back to each pool, proportional to the total loan from all pools
        uint256 repayAmountToThisPool;

        for (
            uint256 poolId = firstPoolId;
            poolId <= firstPoolId.add(self.poolGroupSize);
            poolId = poolId.add(1)
        ) {
            if (remainingRepayAmount == 0) {
                break;
            }

            uint256 loanAmountFromThisPool = poolGroup
                .loanAmountByLoanIdAndPoolId[loanRecord.loanId][poolId];

            if (loanAmountFromThisPool == 0) {
                // Skip this pool since it has no loan
                continue;
            }

            /// Calculate the amount to repay to this pool, e.g., if I loaned total of 100
            /// from all pools, where 10 is from this pool, and I want to repay 50 now.
            /// Then the amount pay back to this pool will be: 50 * 10 / 100 = 5
            repayAmountToThisPool = repayAmount
                .mulFixed(loanAmountFromThisPool)
                .divFixed(loanRecord.loanAmount);

            IStruct.Pool storage pool = poolGroup.poolsById[poolId];
            pool.availableAmount = pool.availableAmount.add(
                repayAmountToThisPool
            );

            remainingRepayAmount = remainingRepayAmount.sub(
                repayAmountToThisPool
            );
        }
    }

    function getPoolsByToken(State storage self, address tokenAddress)
        external
        view
        returns (IStruct.GetPoolsByTokenResponse[] memory poolList)
    {
        PoolGroup storage poolGroup = self.poolGroups[tokenAddress];
        poolList = new IStruct.GetPoolsByTokenResponse[](
            self.poolGroupSize + 1
        );
        uint256 firstPoolId = DateTime.toDays();
        IStruct.Pool memory pool;
        for (uint256 i = 0; i <= self.poolGroupSize; i++) {
            pool = poolGroup.poolsById[firstPoolId.add(i)];
            poolList[i] = IStruct.GetPoolsByTokenResponse({
                poolId: firstPoolId.add(i),
                depositAmount: pool.depositAmount,
                availableAmount: pool.availableAmount,
                loanInterest: pool.loanInterest,
                totalDepositWeight: pool.totalDepositWeight
            });
        }

        return poolList;
    }

    function getPoolById(
        State storage self,
        address tokenAddress,
        uint256 poolId
    ) external view returns (IStruct.Pool memory pool) {
        return self.poolGroups[tokenAddress].poolsById[poolId];
    }
}
