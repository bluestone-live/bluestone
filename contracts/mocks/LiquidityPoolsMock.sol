pragma solidity ^0.6.0;

import '../impl/lib/LiquidityPools.sol';
import '../impl/lib/LoanManager.sol';
import '../lib/DateTime.sol';
import '../lib/SafeMath.sol';
import '../interface/IStruct.sol';

contract LiquidityPoolsMock {
    using LiquidityPools for LiquidityPools.State;
    using LoanManager for LoanManager.State;
    using SafeMath for uint256;

    LiquidityPools.State _liquidityPools;
    LoanManager.State _loanManager;

    bytes32[] public loanIdList;

    function setPoolGroupSizeIfNeeded(address tokenAddress, uint256 numPools)
        external
    {
        _liquidityPools.setPoolGroupSizeIfNeeded(tokenAddress, numPools);
    }

    function addDepositToPool(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        uint256 depositWeight,
        uint256 depositDistributorFeeRatio,
        uint256 loanDistributorFeeRatio,
        uint256 protocolReserveRatio
    ) external returns (uint256 poolId) {
        return
            _liquidityPools.addDepositToPool(
                tokenAddress,
                depositAmount,
                depositTerm,
                depositWeight,
                depositDistributorFeeRatio,
                loanDistributorFeeRatio,
                protocolReserveRatio
            );
    }

    function subtractDepositFromPool(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositWeight,
        uint256 poolId
    ) external {
        _liquidityPools.subtractDepositFromPool(
            tokenAddress,
            depositAmount,
            depositWeight,
            poolId
        );
    }

    function loanFromPools(bytes32 loanId) external {
        IStruct.LoanRecord storage loanRecord = _loanManager
            .loanRecordById[loanId];

        _liquidityPools.loanFromPools(loanRecord);
    }

    function repayLoanToPools(bytes32 loanId, uint256 repayAmount) external {
        IStruct.LoanRecord storage loanRecord = _loanManager
            .loanRecordById[loanId];

        _liquidityPools.repayLoanToPools(loanRecord, repayAmount);
    }

    function getPool(address tokenAddress, uint256 poolIndex)
        external
        view
        returns (
            uint256 depositAmount,
            uint256 availableAmount,
            uint256 loanInterest,
            uint256 totalDepositWeight,
            uint256 depositDistributorFeeRatio,
            uint256 loanDistributorFeeRatio,
            uint256 protocolReserveRatio
        )
    {
        return _liquidityPools.getPool(tokenAddress, poolIndex);
    }

    function getPoolById(address tokenAddress, uint256 poolId)
        external
        view
        returns (
            uint256 depositAmount,
            uint256 availableAmount,
            uint256 loanInterest,
            uint256 totalDepositWeight,
            uint256 depositDistributorFeeRatio,
            uint256 loanDistributorFeeRatio,
            uint256 protocolReserveRatio
        )
    {
        return _liquidityPools.getPoolById(tokenAddress, poolId);
    }

    function getDetailsFromAllPools(address tokenAddress)
        external
        view
        returns (
            uint256[] memory poolIdList,
            uint256[] memory depositAmountList,
            uint256[] memory availableAmountList,
            uint256[] memory loanInterestList,
            uint256[] memory totalDepositWeightList
        )
    {
        return _liquidityPools.getDetailsFromAllPools(tokenAddress);
    }

    function getAvailableAmountByLoanTerm(
        address tokenAddress,
        uint256 loanTerm
    ) external view returns (uint256 availableAmountByLoanTerm) {
        return
            _liquidityPools.getAvailableAmountByLoanTerm(
                tokenAddress,
                loanTerm
            );
    }

    /// --- Helpers

    function getPoolGroupSize(address tokenAddress)
        external
        view
        returns (uint256 numPools)
    {
        return _liquidityPools.poolGroups[tokenAddress].numPools;
    }

    function populatePoolGroup(
        address tokenAddress,
        uint256[] calldata depositAmountList,
        uint256[] calldata availableAmountList
    ) external {
        LiquidityPools.PoolGroup storage poolGroup = _liquidityPools
            .poolGroups[tokenAddress];

        require(
            depositAmountList.length <= poolGroup.numPools + 1,
            'LiquidityPoolsMock: invalid depositAmountList length'
        );
        require(
            depositAmountList.length == availableAmountList.length,
            'LiquidityPoolsMock: depositAmountList and availableAmountList must have the same length'
        );

        uint256 poolId = DateTime.toDays();

        for (uint256 i = 0; i < depositAmountList.length; i++) {
            LiquidityPools.Pool storage pool = poolGroup.poolsById[poolId];
            pool.depositAmount = depositAmountList[i];
            pool.availableAmount = availableAmountList[i];
            poolId = poolId.add(1);
        }
    }

    function createLoanRecord(
        address loanTokenAddress,
        uint256 loanAmount,
        uint256 loanTerm
    ) external {
        bytes32 loanId = keccak256(
            abi.encode(msg.sender, _loanManager.numLoans)
        );

        IStruct.LoanRecord storage loanRecord = _loanManager
            .loanRecordById[loanId];

        loanRecord.loanId = loanId;
        loanRecord.loanTokenAddress = loanTokenAddress;
        loanRecord.loanAmount = loanAmount;
        loanRecord.loanTerm = loanTerm;

        loanIdList.push(loanId);
    }

    function getLoanRecordLoanAmountByPool(bytes32 loanId, uint256 poolIndex)
        external
        view
        returns (uint256 loanAmountByPool)
    {
        IStruct.LoanRecord storage loanRecord = _loanManager
            .loanRecordById[loanId];

        LiquidityPools.PoolGroup storage poolGroup = _liquidityPools
            .poolGroups[loanRecord.loanTokenAddress];

        return
            poolGroup.loanAmountByLoanIdAndPoolId[loanId][DateTime.toDays().add(
                poolIndex
            )];
    }
}
