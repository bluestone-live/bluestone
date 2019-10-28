pragma solidity ^0.5.0;

import '../impl/lib/_LiquidityPools.sol';
import '../impl/lib/_LoanManager.sol';

// TODO(desmond): rename it after refactor complete
contract _LiquidityPoolsMock {
    using _LiquidityPools for _LiquidityPools.State;
    using _LoanManager for _LoanManager.State;

    _LiquidityPools.State _liquidityPools;
    _LoanManager.State _loanManager;

    bytes32[] public loanIdList;

    function initPoolGroupIfNeeded(address tokenAddress, uint256 numPools)
        external
    {
        _liquidityPools.initPoolGroupIfNeeded(tokenAddress, numPools);
    }

    function updatePoolGroupDepositMaturity(address tokenAddress) external {
        _liquidityPools.updatePoolGroupDepositMaturity(tokenAddress);
    }

    function addDepositToPool(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositWeight
    ) external returns (uint256 poolId) {
        return
            _liquidityPools.addDepositToPool(
                tokenAddress,
                depositAmount,
                depositWeight
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
        _LoanManager.LoanRecord storage loanRecord = _loanManager
            .loanRecordById[loanId];

        _liquidityPools.loanFromPools(loanRecord);
    }

    function repayLoanToPools(bytes32 loanId, uint256 repayAmount) external {
        _LoanManager.LoanRecord storage loanRecord = _loanManager
            .loanRecordById[loanId];

        _liquidityPools.repayLoanToPools(loanRecord, repayAmount);
    }

    function getPool(address tokenAddress, uint256 poolIndex)
        external
        view
        returns (
            uint256 depositAmount,
            uint256 borrowedAmount,
            uint256 availableAmount,
            uint256 loanInterest,
            uint256 totalDepositWeight
        )
    {
        return _liquidityPools.getPool(tokenAddress, poolIndex);
    }

    function getPoolById(address tokenAddress, uint256 poolId)
        external
        view
        returns (
            uint256 depositAmount,
            uint256 borrowedAmount,
            uint256 availableAmount,
            uint256 loanInterest,
            uint256 totalDepositWeight
        )
    {
        return _liquidityPools.getPoolById(tokenAddress, poolId);
    }

    function getAvailableAmountOfAllPools(address tokenAddress)
        external
        view
        returns (uint256[] memory availableAmount)
    {
        return _liquidityPools.getAvailableAmountOfAllPools(tokenAddress);
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

    function getPoolGroup(address tokenAddress)
        external
        view
        returns (bool isInitialized, uint256 numPools, uint256 firstPoolId)
    {
        _LiquidityPools.PoolGroup memory poolGroup = _liquidityPools
            .poolGroups[tokenAddress];

        return (
            poolGroup.isInitialized,
            poolGroup.numPools,
            poolGroup.firstPoolId
        );
    }

    function populatePoolGroup(
        address tokenAddress,
        uint256[] calldata depositAmountList,
        uint256[] calldata borrowedAmountList
    ) external {
        _LiquidityPools.PoolGroup storage poolGroup = _liquidityPools
            .poolGroups[tokenAddress];

        require(
            depositAmountList.length <= poolGroup.numPools + 1,
            'LiquidityPoolsMock: invalid depositAmountList length'
        );
        require(
            borrowedAmountList.length <= poolGroup.numPools + 1,
            'LiquidityPoolsMock: invalid borrowedAmountList length'
        );
        require(
            depositAmountList.length == borrowedAmountList.length,
            'LiquidityPoolsMock: depositAmountList and borrowedAmountList must have the same length'
        );

        uint256 poolId = poolGroup.firstPoolId;

        for (uint256 i = 0; i < depositAmountList.length; i++) {
            _LiquidityPools.Pool storage pool = poolGroup.poolsById[poolId];
            pool.depositAmount = depositAmountList[i];
            pool.borrowedAmount = borrowedAmountList[i];
            pool.availableAmount = depositAmountList[i] - borrowedAmountList[i];
            poolId++;
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

        _LoanManager.LoanRecord storage loanRecord = _loanManager
            .loanRecordById[loanId];

        loanRecord.loanTokenAddress = loanTokenAddress;
        loanRecord.loanAmount = loanAmount;
        loanRecord.loanTerm = loanTerm;

        loanIdList.push(loanId);
    }

    function getLoanRecordLoanAmountByPool(bytes32 loanId, uint256 poolId)
        external
        view
        returns (uint256 loanAmountByPool)
    {
        _LoanManager.LoanRecord storage loanRecord = _loanManager
            .loanRecordById[loanId];

        return loanRecord.loanAmountByPool[poolId];
    }
}
