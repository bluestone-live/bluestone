pragma solidity ^0.6.7;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '../../common/lib/DateTime.sol';
import '../lib/LiquidityPools.sol';
import '../lib/LoanManager.sol';
import '../interface/IStruct.sol';


contract LiquidityPoolsMock {
    using LiquidityPools for LiquidityPools.State;
    using LoanManager for LoanManager.State;
    using SafeMath for uint256;

    LiquidityPools.State _liquidityPools;
    LoanManager.State _loanManager;

    bytes32[] public loanIdList;

    function setPoolGroupSize(uint256 poolGroupSize) external {
        _liquidityPools.setPoolGroupSize(poolGroupSize);
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

    function withdrawFromPool(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositWeight,
        uint256 availableAmount,
        uint256 poolId
    ) external {
        _liquidityPools.withdrawFromPool(
            tokenAddress,
            depositAmount,
            depositWeight,
            availableAmount,
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

    function getPoolsByToken(address tokenAddress)
        external
        view
        returns (IStruct.GetPoolsByTokenResponse[] memory poolList)
    {
        return _liquidityPools.getPoolsByToken(tokenAddress);
    }

    function getPoolById(address tokenAddress, uint256 poolId)
        external
        view
        returns (IStruct.Pool memory pool)
    {
        return _liquidityPools.getPoolById(tokenAddress, poolId);
    }

    function getPoolByIndex(address tokenAddress, uint256 poolIndex)
        external
        view
        returns (IStruct.Pool memory pool)
    {
        return
            _liquidityPools.getPoolById(
                tokenAddress,
                DateTime.toDays().add(poolIndex)
            );
    }

    /// --- Helpers

    function getPoolGroupSize() external view returns (uint256 poolGroupSize) {
        return _liquidityPools.poolGroupSize;
    }

    function populatePoolGroup(
        address tokenAddress,
        uint256[] calldata depositAmountList,
        uint256[] calldata availableAmountList,
        uint256[] calldata depositDistributorFeeRatioList,
        uint256[] calldata loanDistributorFeeRatioList,
        uint256[] calldata protocolReserveRatioList
    ) external {
        require(
            depositAmountList.length <= _liquidityPools.poolGroupSize + 1,
            'LiquidityPoolsMock: invalid depositAmountList length'
        );
        require(
            depositAmountList.length == availableAmountList.length,
            'LiquidityPoolsMock: depositAmountList and availableAmountList must have the same length'
        );

        LiquidityPools.PoolGroup storage poolGroup = _liquidityPools
            .poolGroups[tokenAddress];

        uint256 poolId = DateTime.toDays();

        for (uint256 i = 0; i < depositAmountList.length; i++) {
            IStruct.Pool storage pool = poolGroup.poolsById[poolId];
            pool.depositAmount = depositAmountList[i];
            pool.availableAmount = availableAmountList[i];
            pool.depositDistributorFeeRatio = depositDistributorFeeRatioList[i];
            pool.loanDistributorFeeRatio = loanDistributorFeeRatioList[i];
            pool.protocolReserveRatio = protocolReserveRatioList[i];
            poolId = poolId.add(1);
        }
    }

    function createLoanRecord(
        address loanTokenAddress,
        uint256 loanAmount,
        uint256 loanTerm,
        uint256 loanInterest
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
        loanRecord.interest = loanInterest;

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

    function getLoanRecordById(bytes32 loanId)
        external
        view
        returns (IStruct.LoanRecord memory loanRecord)
    {
        return _loanManager.loanRecordById[loanId];
    }
}
