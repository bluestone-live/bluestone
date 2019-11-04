pragma solidity ^0.5.0;

import '../impl/lib/_Configuration.sol';
import '../impl/lib/_LiquidityPools.sol';
import '../impl/lib/_DepositManager.sol';
import '../impl/lib/_LoanManager.sol';
import '../impl/lib/_AccountManager.sol';
import '../interface/IInterestModel.sol';

contract _DepositManagerMock {
    using _Configuration for _Configuration.State;
    using _LiquidityPools for _LiquidityPools.State;
    using _DepositManager for _DepositManager.State;
    using _LoanManager for _LoanManager.State;
    using _AccountManager for _AccountManager.State;

    _Configuration.State _configuration;
    _LiquidityPools.State _liquidityPools;
    _DepositManager.State _depositManager;
    _LoanManager.State _loanManager;
    _AccountManager.State _accountManager;
    _DepositManager.DepositParameters _depositParameters;

    function enableDepositTerm(uint256 term) external {
        _depositManager.enableDepositTerm(_liquidityPools, term);
    }

    function disableDepositTerm(uint256 term) external {
        _depositManager.disableDepositTerm(term);
    }

    function enableDepositToken(address tokenAddress) external {
        _depositManager.enableDepositToken(_liquidityPools, tokenAddress);
    }

    function disableDepositToken(address tokenAddress) external {
        _depositManager.disableDepositToken(tokenAddress);
    }

    function updateDepositMaturity() external {
        _depositManager.updateDepositMaturity(_liquidityPools);
    }

    function setMaxDistributorFeeRatios(
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    ) external {
        _configuration.setMaxDistributorFeeRatios(
            maxDepositDistributorFeeRatio,
            maxLoanDistributorFeeRatio
        );
    }

    function deposit(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        address distributorAddress,
        uint256 depositDistributorFeeRatio
    ) external returns (bytes32 depositId) {
        _depositParameters.tokenAddress = tokenAddress;
        _depositParameters.depositAmount = depositAmount;
        _depositParameters.depositTerm = depositTerm;
        _depositParameters.distributorAddress = distributorAddress;
        _depositParameters
            .depositDistributorFeeRatio = depositDistributorFeeRatio;

        return
            _depositManager.deposit(
                _liquidityPools,
                _accountManager,
                _configuration,
                _depositParameters
            );
    }

    function withdraw(bytes32 depositId)
        external
        returns (uint256 withdrewAmount)
    {
        return _depositManager.withdraw(_configuration, depositId);
    }

    function earlyWithdraw(bytes32 depositId)
        external
        returns (uint256 withdrewAmount)
    {
        return _depositManager.earlyWithdraw(_liquidityPools, depositId);
    }

    function getDepositTerms()
        external
        view
        returns (uint256[] memory depositTermList)
    {
        return _depositManager.enabledDepositTermList;
    }

    function getDepositTokens()
        external
        view
        returns (
            address[] memory depositTokenAddressList,
            bool[] memory isEnabledList
        )
    {
        return _depositManager.getDepositTokens();
    }

    function getDepositRecordById(bytes32 depositId)
        external
        view
        returns (
            address tokenAddress,
            uint256 depositTerm,
            uint256 depositAmount,
            uint256 poolId,
            uint256 createdAt,
            uint256 maturedAt,
            uint256 withdrewAt,
            bool isMatured,
            bool isWithdrawn
        )
    {
        return _depositManager.getDepositRecordById(depositId);
    }

    function getDepositInterestById(bytes32 depositId)
        external
        view
        returns (uint256 interest)
    {
        return
            _depositManager.getDepositInterestById(
                _liquidityPools,
                _configuration,
                depositId
            );
    }

    function getDepositRecordsByAccount(address accountAddress)
        external
        view
        returns (
            bytes32[] memory depositIdList,
            address[] memory tokenAddressList,
            uint256[] memory depositTermList,
            uint256[] memory depositAmountList,
            uint256[] memory createdAtList,
            uint256[] memory maturedAtList,
            uint256[] memory withdrewAtList
        )
    {
        return _depositManager.getDepositRecordsByAccount(accountAddress);
    }

    function isDepositEarlyWithdrawable(bytes32 depositId)
        external
        view
        returns (bool isEarlyWithdrawable)
    {
        return
            _depositManager.isDepositEarlyWithdrawable(
                _liquidityPools,
                depositId
            );
    }

    // --- Helpers ---

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

    function getPoolGroup(address tokenAddress)
        external
        view
        returns (bool isInitialized, uint256 numPools, uint256 firstPoolId)
    {
        _LiquidityPools.PoolGroup storage poolGroup = _liquidityPools
            .poolGroups[tokenAddress];

        return (
            poolGroup.isInitialized,
            poolGroup.numPools,
            poolGroup.firstPoolId
        );
    }

    function setInterestModel(IInterestModel interestModel) external {
        _configuration.setInterestModel(interestModel);
    }

    function getInterestFromDaysAgo(
        address tokenAddress,
        uint256 depositWeight,
        uint256 numDaysAgo
    ) external view returns (uint256 interest) {
        return
            _depositManager._getInterestFromDaysAgo(
                tokenAddress,
                depositWeight,
                numDaysAgo
            );
    }

    function setProtocolAddress(address protocolAddress) external {
        _configuration.setProtocolAddress(protocolAddress);
    }

    // -- Helper

    function setInterestHistoryByTokenAddress(
        address tokenAddress,
        uint256[] calldata totalDepositWeightList,
        uint256[] calldata totalInterestList
    ) external {
        _DepositManager.DepositInterestHistory storage history = _depositManager
            .depositTokenByAddress[tokenAddress]
            .depositInterestHistory;

        for (uint256 i = 0; i < totalDepositWeightList.length; i++) {
            history.totalDepositWeightByDay[i] = totalDepositWeightList[i];
            history.totalInterestByDay[i] = totalInterestList[i];
        }

        history.lastDay = totalDepositWeightList.length - 1;
    }
}
