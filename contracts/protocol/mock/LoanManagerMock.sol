pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '../../oracle/interface/IPriceOracle.sol';
import '../interface/IInterestModel.sol';
import '../interface/IStruct.sol';
import '../lib/Configuration.sol';
import '../lib/LiquidityPools.sol';
import '../lib/DepositManager.sol';
import '../lib/LoanManager.sol';


contract LoanManagerMock {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using DepositManager for DepositManager.State;
    using LoanManager for LoanManager.State;

    Configuration.State _configuration;
    LiquidityPools.State _liquidityPools;
    DepositManager.State _depositManager;
    LoanManager.State _loanManager;

    function setMaxDistributorFeeRatios(
        uint256 depositDistributorFeeRatio,
        uint256 loanDistributorFeeRatio
    ) external {
        _configuration.setMaxDistributorFeeRatios(
            depositDistributorFeeRatio,
            loanDistributorFeeRatio
        );
    }

    function loan(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 loanTerm,
        address payable distributorAddress
    ) external payable returns (bytes32 loanId) {
        IStruct.LoanParameters memory loanParameters = IStruct.LoanParameters({
            loanTokenAddress: loanTokenAddress,
            collateralTokenAddress: collateralTokenAddress,
            loanAmount: loanAmount,
            collateralAmount: collateralAmount,
            loanTerm: loanTerm,
            distributorAddress: distributorAddress
        });
        if (collateralTokenAddress == address(1)) {
            loanParameters.collateralAmount = msg.value;
        } else {
            loanParameters.collateralAmount = collateralAmount;
        }

        return
            _loanManager.loan(_configuration, _liquidityPools, loanParameters);
    }

    function repayLoan(bytes32 loanId, uint256 repayAmount)
        external
        returns (uint256 remainingDebt)
    {
        return
            _loanManager.repayLoan(
                _liquidityPools,
                _configuration,
                loanId,
                repayAmount
            );
    }

    function liquidateLoan(bytes32 loanId, uint256 liquidateAmount)
        external
        returns (uint256 remainingCollateral, uint256 liquidatedAmount)
    {
        return
            _loanManager.liquidateLoan(
                _configuration,
                _liquidityPools,
                loanId,
                liquidateAmount
            );
    }

    function getLoanRecordById(bytes32 loanId)
        external
        view
        returns (IStruct.GetLoanRecordResponse memory loanRecord)
    {
        return _loanManager.getLoanRecordById(_configuration, loanId);
    }

    function getLoanRecordsByAccount(address accountAddress)
        external
        view
        returns (IStruct.GetLoanRecordResponse[] memory loanRecordList)
    {
        return
            _loanManager.getLoanRecordsByAccount(
                _configuration,
                accountAddress
            );
    }

    function addCollateral(bytes32 loanId, uint256 collateralAmount)
        external
        payable
        returns (uint256 totalCollateralAmount)
    {
        if (msg.value > 0) {
            return
                _loanManager.addCollateral(_configuration, loanId, msg.value);
        } else {
            return
                _loanManager.addCollateral(
                    _configuration,
                    loanId,
                    collateralAmount
                );
        }
    }

    function subtractCollateral(bytes32 loanId, uint256 collateralAmount)
        external
        payable
        returns (uint256 totalCollateralAmount)
    {
        return
            _loanManager.subtractCollateral(
                _configuration,
                loanId,
                collateralAmount
            );
    }

    function setLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 minCollateralCoverageRatio,
        uint256 liquidationDiscount
    ) external {
        _loanManager.setLoanAndCollateralTokenPair(
            loanTokenAddress,
            collateralTokenAddress,
            minCollateralCoverageRatio,
            liquidationDiscount
        );
    }

    function removeLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external {
        _loanManager.removeLoanAndCollateralTokenPair(
            loanTokenAddress,
            collateralTokenAddress
        );
    }

    function getLoanAndCollateralTokenPairs()
        external
        view
        returns (
            IStruct.LoanAndCollateralTokenPair[] memory loanAndCollateralTokenPairList
        )
    {
        return _loanManager.getLoanAndCollateralTokenPairs();
    }

    /// --- Helpers ---

    function enableDepositTerm(uint256 term) external {
        _depositManager.enableDepositTerm(_liquidityPools, term);
    }

    function enableDepositToken(address tokenAddress) external {
        _depositManager.enableDepositToken(_liquidityPools, tokenAddress);
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

    function getLoanInterestRate(address tokenAddress, uint256 term)
        external
        view
        returns (uint256 loanInterestRate)
    {
        return
            _loanManager.getLoanInterestRate(
                _configuration,
                _liquidityPools,
                tokenAddress,
                term
            );
    }

    function getPoolsByToken(address tokenAddress)
        external
        view
        returns (IStruct.getPoolsByTokenResponse[] memory poolList)
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

    function setPriceOracle(address tokenAddress, IPriceOracle priceOracle)
        external
    {
        _configuration.setPriceOracle(tokenAddress, priceOracle);
    }

    function setPoolGroupSize(uint256 poolGroupSize) external {
        _liquidityPools.setPoolGroupSize(poolGroupSize);
    }

    function setInterestModel(IInterestModel interestModel) external {
        _configuration.setInterestModel(interestModel);
    }

    function setBalanceCap(address tokenAddress, uint256 balanceCap) external {
        _configuration.setBalanceCap(tokenAddress, balanceCap);
    }
}
