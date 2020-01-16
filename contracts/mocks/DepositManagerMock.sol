pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '../impl/lib/Configuration.sol';
import '../impl/lib/LiquidityPools.sol';
import '../impl/lib/DepositManager.sol';
import '../impl/lib/LoanManager.sol';
import '../impl/lib/AccountManager.sol';
import '../interface/IInterestModel.sol';
import '../interface/IStruct.sol';

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
                _accountManager,
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
        return
            _depositManager.earlyWithdraw(
                _liquidityPools,
                _configuration,
                depositId
            );
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

    function setProtocolAddress(address payable protocolAddress) external {
        _configuration.setProtocolAddress(protocolAddress);
    }
    function setPayableProxy(IPayableProxy payableProxy) external {
        _configuration.setPayableProxy(payableProxy);
        ERC20(payableProxy.getWETHAddress()).approve(
            address(payableProxy),
            uint256(-1)
        );
    }

    function getWETHAddress() public view returns (address wethAddress) {
        return _configuration.payableProxy.getWETHAddress();
    }
}
