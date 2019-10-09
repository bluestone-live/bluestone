pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';
import '../interface/IProtocol.sol';
import './lib/_Configuration.sol';
import './lib/_LiquidityPools.sol';
import './lib/_DepositManager.sol';
import './lib/_LoanManager.sol';
import './lib/_AccountManager.sol';
import './_PriceOracle.sol';

/// @title Main contract
/// TODO(ZhangRGK): add IProtocol to interface implemention after all method implement
contract Protocol is Ownable, Pausable {
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

    event LockUserActions();
    event UnlockUserActions();

    modifier whenUserActionsUnlocked() {
        require(
            !_configuration.isUserActionsLocked,
            'Protocol: user actions must be unlocked'
        );
        _;
    }

    modifier whenUserActionsLocked() {
        require(
            _configuration.isUserActionsLocked,
            'Protocol: user actions must be locked'
        );
        _;
    }

    /// --- Deposit Configurations---

    function enableDepositTerm(uint256 term) external whenNotPaused onlyOwner {
        _depositManager.enableDepositTerm(_liquidityPools, term);
    }

    function disableDepositTerm(uint256 term) external whenNotPaused onlyOwner {
        _depositManager.disableDepositTerm(term);
    }

    function enableDepositToken(address tokenAddress)
        external
        whenNotPaused
        onlyOwner
    {
        _depositManager.enableDepositToken(_liquidityPools, tokenAddress);
    }

    function disableDepositToken(address tokenAddress)
        external
        whenNotPaused
        onlyOwner
    {
        _depositManager.disableDepositToken(tokenAddress);
    }

    function updateDepositMaturity()
        external
        whenNotPaused
        whenUserActionsLocked
        onlyOwner
    {
        _depositManager.updateDepositMaturity(_liquidityPools, _loanManager);
    }

    function deposit(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm
    )
        external
        whenNotPaused
        whenUserActionsUnlocked
        returns (bytes32 depositId)
    {
        return
            _depositManager.deposit(
                _liquidityPools,
                _loanManager,
                tokenAddress,
                depositAmount,
                depositTerm
            );
    }

    function withdraw(bytes32 depositId)
        external
        whenNotPaused
        whenUserActionsUnlocked
        returns (uint256 withdrewAmount)
    {
        return _depositManager.withdraw(_configuration, depositId);
    }

    function earlyWithdraw(bytes32 depositId)
        external
        whenNotPaused
        whenUserActionsUnlocked
        returns (uint256 withdrewAmount)
    {
        return
            _depositManager.earlyWithdraw(
                _liquidityPools,
                _loanManager,
                depositId
            );
    }

    function getDepositTerms()
        external
        view
        whenNotPaused
        returns (uint256[] memory depositTermList)
    {
        return _depositManager.enabledDepositTermList;
    }

    function getDepositTokens()
        external
        view
        whenNotPaused
        returns (
            address[] memory depositTokenAddressList,
            bool[] memory isEnabledList
        )
    {
        return _depositManager.getDepositTokens();
    }

    /// --- Deposit

    function getDepositRecordById(bytes32 depositId)
        external
        view
        whenNotPaused
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
        whenNotPaused
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
        whenNotPaused
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
        whenNotPaused
        returns (bool isEarlyWithdrawable)
    {
        return
            _depositManager.isDepositEarlyWithdrawable(
                _liquidityPools,
                depositId
            );
    }

    /// --- Loan

    function addLoanTerm(uint256 loanTerm) external whenNotPaused onlyOwner {
        _loanManager.addLoanTerm(loanTerm);
    }

    function removeLoanTerm(uint256 loanTerm) external whenNotPaused onlyOwner {
        _loanManager.removeLoanTerm(loanTerm);
    }

    function loan(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 loanTerm,
        bool useFreedCollateral
    ) external whenNotPaused whenUserActionsUnlocked returns (bytes32 loanId) {
        return
            _loanManager.loan(
                _configuration,
                _liquidityPools,
                _depositManager,
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
        whenNotPaused
        whenUserActionsUnlocked
        returns (uint256 remainingDebt)
    {
        return
            _loanManager.repayLoan(
                _liquidityPools,
                _depositManager,
                loanId,
                repayAmount
            );
    }

    function liquidateLoan(bytes32 loanId, uint256 liquidateAmount)
        external
        whenNotPaused
        whenUserActionsUnlocked
        returns (uint256 remainingCollateral, uint256 liquidatedAmount)
    {
        return
            _loanManager.liquidateLoan(
                _configuration,
                _liquidityPools,
                _depositManager,
                loanId,
                liquidateAmount
            );
    }

    function getLoanTerms()
        external
        view
        whenNotPaused
        returns (uint256[] memory loanTermList)
    {
        return _loanManager.loanTermList;
    }

    function getFreedCollateralsByAccount(address accountAddress)
        external
        view
        whenNotPaused
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
    ) external whenNotPaused whenUserActionsUnlocked {
        address accountAddress = msg.sender;
        _loanManager.withdrawFreedCollateral(
            accountAddress,
            tokenAddress,
            collateralAmount
        );
    }

    /// --- AccountManager ---

    function getAccountGeneralStat(address accountAddress, string calldata key)
        external
        view
        whenNotPaused
        returns (uint256)
    {
        return _accountManager.getAccountGeneralStat(accountAddress, key);
    }

    function getAccountTokenStat(
        address accountAddress,
        address tokenAddress,
        string calldata key
    ) external view whenNotPaused returns (uint256) {
        return
            _accountManager.getAccountTokenStat(
                accountAddress,
                tokenAddress,
                key
            );
    }

    /// -- Loan ---

    function getLoanRecordById(bytes32 loanId)
        external
        view
        whenNotPaused
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
        whenNotPaused
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
    )
        external
        whenNotPaused
        whenUserActionsUnlocked
        returns (uint256 totalCollateralAmount)
    {
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
    ) external whenNotPaused onlyOwner {
        _loanManager.enableLoanAndCollateralTokenPair(
            loanTokenAddress,
            collateralTokenAddress
        );
    }

    function disableLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external whenNotPaused onlyOwner {
        _loanManager.disableLoanAndCollateralTokenPair(
            loanTokenAddress,
            collateralTokenAddress
        );
    }

    function setMinCollateralCoverageRatiosForToken(
        address loanTokenAddress,
        address[] calldata collateralTokenAddressList,
        uint256[] calldata minCollateralCoverageRatioList
    ) external whenNotPaused onlyOwner {
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
    ) external whenNotPaused onlyOwner {
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
    ) external whenNotPaused onlyOwner {
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

    /// --- Configuration ---
    function setPriceOracleAddress(address priceOracleAddress)
        external
        whenNotPaused
        onlyOwner
    {
        _configuration.setPriceOracleAddress(priceOracleAddress);
    }

    function setProtocolAddress(address protocolAddress)
        external
        whenNotPaused
        onlyOwner
    {
        _configuration.setProtocolAddress(protocolAddress);
    }

    function setProtocolReserveRatio(uint256 protocolReserveRatio)
        external
        whenNotPaused
        onlyOwner
    {
        _configuration.setProtocolReserveRatio(protocolReserveRatio);
    }

    function lockUserActions() external whenNotPaused onlyOwner {
        _configuration.lockUserActions();
    }

    function unlockUserActions() external whenNotPaused onlyOwner {
        _configuration.unlockUserActions();
    }

    function getProtocolAddress()
        external
        view
        whenNotPaused
        returns (address protocolAddress)
    {
        return _configuration.protocolAddress;
    }

    function getProtocolReserveRatio()
        external
        view
        whenNotPaused
        returns (uint256 protocolReserveRatio)
    {
        return _configuration.protocolReserveRatio;
    }

    function isUserActionsLocked() external view returns (bool isLocked) {
        return _configuration.isUserActionsLocked;
    }
}
