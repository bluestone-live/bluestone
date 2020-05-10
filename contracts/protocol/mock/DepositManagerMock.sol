pragma solidity ^0.6.7;
pragma experimental ABIEncoderV2;

import '../interface/IStruct.sol';
import '../interface/IInterestModel.sol';
import '../lib/Configuration.sol';
import '../lib/LiquidityPools.sol';
import '../lib/DepositManager.sol';
import '../lib/LoanManager.sol';


contract DepositManagerMock {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using DepositManager for DepositManager.State;
    using LoanManager for LoanManager.State;

    Configuration.State _configuration;
    LiquidityPools.State _liquidityPools;
    DepositManager.State _depositManager;
    LoanManager.State _loanManager;

    function enableDepositTerm(uint256 term) external {
        _depositManager.enableDepositTerm(_liquidityPools, term);
    }

    function disableDepositTerm(uint256 term) external {
        _depositManager.disableDepositTerm(term);
    }

    function enableDepositToken(address tokenAddress) external {
        _depositManager.enableDepositToken(tokenAddress);
    }

    function disableDepositToken(address tokenAddress) external {
        _depositManager.disableDepositToken(tokenAddress);
    }

    function setMaxDistributorFeeRatios(
        uint256 depositDistributorFeeRatio,
        uint256 loanDistributorFeeRatio
    ) external {
        _configuration.setMaxDistributorFeeRatios(
            depositDistributorFeeRatio,
            loanDistributorFeeRatio
        );
    }

    function deposit(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        address payable distributorAddress
    ) external payable returns (bytes32 depositId) {
        IStruct.DepositParameters memory depositParameters = IStruct
            .DepositParameters({
            tokenAddress: tokenAddress,
            depositAmount: depositAmount,
            depositTerm: depositTerm,
            distributorAddress: distributorAddress
        });

        if (tokenAddress == address(1)) {
            depositParameters.depositAmount = msg.value;
        } else {
            depositParameters.depositAmount = depositAmount;
        }

        return
            _depositManager.deposit(
                _liquidityPools,
                _configuration,
                depositParameters
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
        return _depositManager.depositTermList;
    }

    function getDepositTokens()
        external
        view
        returns (address[] memory depositTokenAddressList)
    {
        return _depositManager.depositTokenAddressList;
    }

    function getDepositRecordById(bytes32 depositId)
        external
        view
        returns (IStruct.GetDepositRecordResponse memory depositRecord)
    {
        return _depositManager.getDepositRecordById(_liquidityPools, depositId);
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
            _depositManager._getInterestDistributionByDepositId(
                _liquidityPools,
                depositId
            );
    }

    function getDepositRecordsByAccount(address accountAddress)
        external
        view
        returns (IStruct.GetDepositRecordResponse[] memory depositRecordList)
    {
        return
            _depositManager.getDepositRecordsByAccount(
                _liquidityPools,
                accountAddress
            );
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
        returns (IStruct.Pool memory pool)
    {
        return _liquidityPools.getPoolById(tokenAddress, poolId);
    }

    function getPoolGroupSize() external view returns (uint256 poolGroupSize) {
        return _liquidityPools.poolGroupSize;
    }

    function setInterestModel(IInterestModel interestModel) external {
        _configuration.setInterestModel(interestModel);
    }

    function setInterestReserveAddress(address payable interestReserveAddress)
        external
    {
        _configuration.setInterestReserveAddress(interestReserveAddress);
    }

    function setBalanceCap(address tokenAddress, uint256 balanceCap) external {
        _configuration.setBalanceCap(tokenAddress, balanceCap);
    }
}
