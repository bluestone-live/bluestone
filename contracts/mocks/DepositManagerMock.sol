pragma solidity ^0.6.0;

import '../impl/lib/Configuration.sol';
import '../impl/lib/LiquidityPools.sol';
import '../impl/lib/DepositManager.sol';
import '../impl/lib/LoanManager.sol';
import '../impl/lib/AccountManager.sol';
import '../interface/IInterestModel.sol';

contract DepositManagerMock {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using DepositManager for DepositManager.State;
    using LoanManager for LoanManager.State;
    using AccountManager for AccountManager.State;

    Configuration.State _configuration;
    LiquidityPools.State _liquidityPools;
    DepositManager.State _depositManager;
    LoanManager.State _loanManager;
    AccountManager.State _accountManager;
    DepositManager.DepositParameters _depositParameters;

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
        address distributorAddress
    ) external returns (bytes32 depositId) {
        _depositParameters.tokenAddress = tokenAddress;
        _depositParameters.depositAmount = depositAmount;
        _depositParameters.depositTerm = depositTerm;
        _depositParameters.distributorAddress = distributorAddress;

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
        return
            _depositManager.withdraw(
                _configuration,
                _liquidityPools,
                depositId
            );
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
        returns (address[] memory depositTokenAddressList)
    {
        return _depositManager.enabledDepositTokenAddressList;
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

    function getInterestDistributionByDepositId(bytes32 depositId)
        external
        view
        returns (
            uint256 interestForDepositor,
            uint256 interestForDepositDistributor,
            uint256 interestForLoanDistributor,
            uint256 interestForProtocolReserve
        )
    {
        return
            _depositManager.getInterestDistributionByDepositId(
                _liquidityPools,
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

    function getPoolGroupSize(address tokenAddress)
        external
        view
        returns (uint256 numPools)
    {
        return _liquidityPools.poolGroups[tokenAddress].numPools;
    }

    function setInterestModel(IInterestModel interestModel) external {
        _configuration.setInterestModel(interestModel);
    }

    function setProtocolAddress(address protocolAddress) external {
        _configuration.setProtocolAddress(protocolAddress);
    }
}
