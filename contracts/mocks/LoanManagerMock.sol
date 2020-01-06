pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '../impl/lib/Configuration.sol';
import '../impl/lib/LiquidityPools.sol';
import '../impl/lib/DepositManager.sol';
import '../impl/lib/LoanManager.sol';
import '../impl/lib/AccountManager.sol';
import '../interface/IInterestModel.sol';
import '../interface/IPriceOracle.sol';
import '../interface/IStruct.sol';

contract LoanManagerMock {
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

    function setMaxDistributorFeeRatios(
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    ) external {
        _configuration.setMaxDistributorFeeRatios(
            maxDepositDistributorFeeRatio,
            maxLoanDistributorFeeRatio
        );
    }

    function loan(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 loanTerm,
        address distributorAddress
    ) external returns (bytes32 loanId) {
        IStruct.LoanParameters memory loanParameters = IStruct.LoanParameters({
            loanTokenAddress: loanTokenAddress,
            collateralTokenAddress: collateralTokenAddress,
            loanAmount: loanAmount,
            collateralAmount: collateralAmount,
            loanTerm: loanTerm,
            distributorAddress: distributorAddress
        });

        return
            _loanManager.loan(_configuration, _liquidityPools, loanParameters);
    }

    function repayLoan(bytes32 loanId, uint256 repayAmount)
        external
        returns (uint256 remainingDebt)
    {
        return _loanManager.repayLoan(_liquidityPools, loanId, repayAmount);
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
        returns (IStruct.LoanRecord memory loanRecord)
    {
        return _loanManager.getLoanRecordById(loanId);
    }

    function getLoanRecordDetailsById(bytes32 loanId)
        external
        view
        returns (
            uint256 remainingDebt,
            uint256 currentCollateralRatio,
            bool isLiquidatable,
            bool isOverDue,
            bool isClosed
        )
    {
        return _loanManager.getLoanRecordDetailsById(_configuration, loanId);
    }

    function getLoanRecordsByAccount(address accountAddress)
        external
        view
        returns (IStruct.LoanRecord[] memory loanRecordList)
    {
        return _loanManager.getLoanRecordsByAccount(accountAddress);
    }

    function addCollateral(bytes32 loanId, uint256 collateralAmount)
        external
        returns (uint256 totalCollateralAmount)
    {
        return _loanManager.addCollateral(loanId, collateralAmount);
    }

    function enableLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external {
        _loanManager.enableLoanAndCollateralTokenPair(
            loanTokenAddress,
            collateralTokenAddress
        );
    }

    function disableLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external {
        _loanManager.disableLoanAndCollateralTokenPair(
            loanTokenAddress,
            collateralTokenAddress
        );
    }

    function setMinCollateralCoverageRatiosForToken(
        address loanTokenAddress,
        address[] calldata collateralTokenAddressList,
        uint256[] calldata minCollateralCoverageRatioList
    ) external {
        _loanManager.setMinCollateralCoverageRatiosForToken(
            loanTokenAddress,
            collateralTokenAddressList,
            minCollateralCoverageRatioList
        );
    }

    function setLiquidationDiscountsForToken(
        address loanTokenAddress,
        address[] calldata collateralTokenAddressList,
        uint256[] calldata liquidationDiscountList
    ) external {
        _loanManager.setLiquidationDiscountsForToken(
            loanTokenAddress,
            collateralTokenAddressList,
            liquidationDiscountList
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

    function getTokenAddressList(uint256 tokenType)
        external
        view
        returns (address[] memory tokenAddressList, bool[] memory isActive)
    {
        return _loanManager.getTokenAddressList(tokenType);
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
        address distributorAddress
    ) external returns (bytes32 depositId) {
        IStruct.DepositParameters memory depositParameters = IStruct
            .DepositParameters({
            tokenAddress: tokenAddress,
            depositAmount: depositAmount,
            depositTerm: depositTerm,
            distributorAddress: distributorAddress
        });

        return
            _depositManager.deposit(
                _liquidityPools,
                _accountManager,
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

    function setPriceOracle(address tokenAddress, IPriceOracle priceOracle)
        external
    {
        _configuration.setPriceOracle(tokenAddress, priceOracle);
    }

    function setPoolGroupSizeIfNeeded(address tokenAddress, uint256 numPools)
        external
    {
        _liquidityPools.setPoolGroupSizeIfNeeded(tokenAddress, numPools);
    }

    function setInterestModel(IInterestModel interestModel) external {
        _configuration.setInterestModel(interestModel);
    }
}
