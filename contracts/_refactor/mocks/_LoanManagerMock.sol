pragma solidity ^0.5.0;

import '../impl/lib/_Configuration.sol';
import '../impl/lib/_LiquidityPools.sol';
import '../impl/lib/_DepositManager.sol';
import '../impl/lib/_LoanManager.sol';
import '../impl/lib/_AccountManager.sol';

contract _LoanManagerMock {
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

    function loan(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 loanTerm,
        bool useFreedCollateral
    ) external returns (bytes32 loanId) {
        return
            _loanManager.loan(
                _configuration,
                _liquidityPools,
                loanTokenAddress,
                collateralTokenAddress,
                loanAmount,
                collateralAmount,
                loanTerm,
                useFreedCollateral
            );
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

    // TODO(desmond): getMaxLoanTerm

    function getFreedCollateralsByAccount(address accountAddress)
        external
        view
        returns (
            address[] memory tokenAddressList,
            uint256[] memory freedCollateralAmountList
        )
    {
        return _loanManager.getFreedCollateralsByAccount(accountAddress);
    }

    function withdrawFreedCollateral(
        address tokenAddress,
        uint256 collateralAmount
    ) external {
        address accountAddress = msg.sender;
        _loanManager.withdrawFreedCollateral(
            accountAddress,
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
            uint256 collateralAmount,
            uint256 createdAt,
            uint256 remainingDebt,
            uint256 currentCollateralRatio,
            bool isLiquidatable,
            bool isOverDue,
            bool isClosed
        )
    {
        return _loanManager.getLoanRecordById(_configuration, loanId);
    }

    function getLoanRecordsByAccount(address accountAddress)
        external
        view
        returns (
            bytes32[] memory loanIdList,
            address[] memory loanTokenAddressList,
            address[] memory collateralTokenAddressList,
            uint256[] memory loanTermList,
            uint256[] memory remainingDebtList,
            uint256[] memory createdAtList,
            bool[] memory isClosedList
        )
    {
        return _loanManager.getLoanRecordsByAccount(accountAddress);
    }

    function addCollateral(
        bytes32 loanId,
        uint256 collateralAmount,
        bool useFreedCollateral
    ) external returns (uint256 totalCollateralAmount) {
        return
            _loanManager.addCollateral(
                loanId,
                collateralAmount,
                useFreedCollateral
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

    function setLoanInterestRatesForToken(
        address tokenAddress,
        uint256[] calldata loanTerms,
        uint256[] calldata loanInterestRateList
    ) external {
        _loanManager.setLoanInterestRatesForToken(
            tokenAddress,
            loanTerms,
            loanInterestRateList
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
        uint256 depositTerm
    ) external returns (bytes32 depositId) {
        return
            _depositManager.deposit(
                _liquidityPools,
                _accountManager,
                tokenAddress,
                depositAmount,
                depositTerm
            );
    }

    function setPriceOracleAddress(address priceOracleAddress) external {
        _configuration.setPriceOracleAddress(priceOracleAddress);
    }

    function initPoolGroupIfNeeded(address tokenAddress, uint256 numPools)
        external
    {
        _liquidityPools.initPoolGroupIfNeeded(tokenAddress, numPools);
    }
}
