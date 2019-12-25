pragma solidity ^0.6.0;

import '../impl/lib/Configuration.sol';
import '../impl/lib/LiquidityPools.sol';
import '../impl/lib/DepositManager.sol';
import '../impl/lib/LoanManager.sol';
import '../impl/lib/AccountManager.sol';
import '../interface/IInterestModel.sol';
import '../interface/IPriceOracle.sol';

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
    LoanManager.LoanParameters _loanParameters;
    DepositManager.DepositParameters _depositParameters;

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
        bool useAvailableCollateral,
        address distributorAddress
    ) external returns (bytes32 loanId) {
        _loanParameters.loanTokenAddress = loanTokenAddress;
        _loanParameters.collateralTokenAddress = collateralTokenAddress;
        _loanParameters.loanAmount = loanAmount;
        _loanParameters.collateralAmount = collateralAmount;
        _loanParameters.loanTerm = loanTerm;
        _loanParameters.useAvailableCollateral = useAvailableCollateral;
        _loanParameters.distributorAddress = distributorAddress;
        _loanParameters.loanDistributorFeeRatio = _configuration
            .maxLoanDistributorFeeRatio;

        return
            _loanManager.loan(_configuration, _liquidityPools, _loanParameters);
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

    function getAvailableCollateralsByAccount(address accountAddress)
        external
        view
        returns (
            address[] memory tokenAddressList,
            uint256[] memory availableCollateralAmountList
        )
    {
        return _loanManager.getAvailableCollateralsByAccount(accountAddress);
    }

    function withdrawAvailableCollateral(
        address tokenAddress,
        uint256 collateralAmount
    ) external {
        _loanManager.withdrawAvailableCollateral(
            tokenAddress,
            collateralAmount
        );
    }

    function getLoanRecordById(bytes32 loanId)
        external
        view
        returns (
            address loanTokenAddress,
            address collateralTokenAddress,
            uint256 loanTerm,
            uint256 loanAmount,
            uint256 collateralAmount,
            uint256 createdAt
        )
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
        returns (
            bytes32[] memory loanIdList,
            address[] memory loanTokenAddressList,
            address[] memory collateralTokenAddressList,
            uint256[] memory loanTermList,
            uint256[] memory loanAmountList,
            uint256[] memory collateralAmountList,
            uint256[] memory createdAtList
        )
    {
        return _loanManager.getLoanRecordsByAccount(accountAddress);
    }

    function addCollateral(
        bytes32 loanId,
        uint256 collateralAmount,
        bool useAvailableCollateral
    ) external returns (uint256 totalCollateralAmount) {
        return
            _loanManager.addCollateral(
                loanId,
                collateralAmount,
                useAvailableCollateral
            );
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
            address[] memory loanTokenAddressList,
            address[] memory collateralTokenAddressList,
            bool[] memory isEnabledList,
            uint256[] memory minCollateralCoverageRatioList,
            uint256[] memory liquidationDiscountList
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

    function addAvailableCollateral(
        address accountAddress,
        address tokenAddress,
        uint256 amount
    ) external {
        _loanManager.addAvailableCollateral(
            accountAddress,
            tokenAddress,
            amount
        );
    }

    function subtractAvailableCollateral(
        address accountAddress,
        address tokenAddress,
        uint256 amount
    ) external returns (uint256) {
        _loanManager.subtractAvailableCollateral(
            accountAddress,
            tokenAddress,
            amount
        );
    }
}
