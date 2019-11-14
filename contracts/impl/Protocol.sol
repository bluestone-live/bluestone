pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';
import '../interface/IProtocol.sol';
import '../interface/IPriceOracle.sol';
import '../interface/IInterestModel.sol';
import './lib/Configuration.sol';
import './lib/LiquidityPools.sol';
import './lib/DepositManager.sol';
import './lib/LoanManager.sol';
import './lib/AccountManager.sol';
import './PriceOracle.sol';

/// @title Main contract
contract Protocol is IProtocol, Ownable, Pausable {
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

    event DepositSucceed(address indexed accountAddress, bytes32 depositId);
    event WithdrawSucceed(address indexed accountAddress, bytes32 depositId);
    event LoanSucceed(address indexed accountAddress, bytes32 loanId);
    event RepayLoanSucceed(address indexed accountAddress, bytes32 loanId);
    event LiquidateLoanSucceed(address indexed accountAddress, bytes32 loanId);
    event WithdrawAvailableCollateralSucceed(
        address indexed accountAddress,
        uint256 amount
    );
    event AddCollateralSucceed(
        address indexed accountAddress,
        bytes32 indexed loanId,
        uint256 amount
    );
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
        _depositManager.updateDepositMaturity(_liquidityPools);
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
        _depositParameters.tokenAddress = tokenAddress;
        _depositParameters.depositAmount = depositAmount;
        _depositParameters.depositTerm = depositTerm;

        return
            _depositManager.deposit(
                _liquidityPools,
                _accountManager,
                _configuration,
                _depositParameters
            );
    }

    function deposit(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        address distributorAddress,
        uint256 depositDistributorFeeRatio
    )
        external
        whenNotPaused
        whenUserActionsUnlocked
        returns (bytes32 depositId)
    {
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
        return _depositManager.earlyWithdraw(_liquidityPools, depositId);
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

    function setMaxLoanTerm(address tokenAddress, uint256 maxLoanTerm)
        external
        whenNotPaused
        onlyOwner
    {
        _loanManager.setMaxLoanTerm(_liquidityPools, tokenAddress, maxLoanTerm);
    }

    function getMaxLoanTerm(address tokenAddress)
        external
        view
        returns (uint256 maxLoanTerm)
    {
        return _loanManager.getMaxLoanTerm(_liquidityPools, tokenAddress);
    }

    function loan(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 loanTerm,
        bool useAvailableCollateral,
        address distributorAddress
    ) external whenNotPaused whenUserActionsUnlocked returns (bytes32 loanId) {
        _loanParameters.loanTokenAddress = loanTokenAddress;
        _loanParameters.collateralTokenAddress = collateralTokenAddress;
        _loanParameters.loanAmount = loanAmount;
        _loanParameters.collateralAmount = collateralAmount;
        _loanParameters.loanTerm = loanTerm;
        _loanParameters.useAvailableCollateral = useAvailableCollateral;

        _loanParameters.distributorAddress = distributorAddress;
        _loanParameters.loanDistributorFeeRatio = _configuration
            .maxLoanDistributorFeeRatio;

        loanId = _loanManager.loan(
            _configuration,
            _liquidityPools,
            _loanParameters
        );
        _loanManager.addToLoanStat(
            _accountManager,
            loanTokenAddress,
            loanAmount
        );
        return loanId;
    }

    function repayLoan(bytes32 loanId, uint256 repayAmount)
        external
        whenNotPaused
        whenUserActionsUnlocked
        returns (uint256 remainingDebt)
    {
        return _loanManager.repayLoan(_liquidityPools, loanId, repayAmount);
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
                loanId,
                liquidateAmount
            );
    }

    function withdrawAvailableCollateral(
        address tokenAddress,
        uint256 collateralAmount
    ) external whenNotPaused whenUserActionsUnlocked {
        _loanManager.withdrawAvailableCollateral(
            tokenAddress,
            collateralAmount
        );
    }

    function getAvailableCollateralsByAccount(address accountAddress)
        external
        view
        whenNotPaused
        returns (
            address[] memory tokenAddressList,
            uint256[] memory availableCollateralAmountList
        )
    {
        return _loanManager.getAvailableCollateralsByAccount(accountAddress);
    }

    function getLoanInterestRate(address tokenAddress, uint256 term)
        external
        view
        whenNotPaused
        whenUserActionsUnlocked
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
        whenNotPaused
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
        bool useAvailableCollateral
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
                useAvailableCollateral
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

    /// --- LiquidityPools ---

    function getAvailableAmountOfAllPools(address tokenAddress)
        external
        view
        whenNotPaused
        returns (uint256[] memory availableAmount)
    {
        return _liquidityPools.getAvailableAmountOfAllPools(tokenAddress);
    }

    /// --- Configuration ---
    function setPriceOracle(IPriceOracle priceOracle)
        external
        whenNotPaused
        onlyOwner
    {
        _configuration.setPriceOracle(priceOracle);
    }

    function setInterestModel(IInterestModel interestModel)
        external
        whenNotPaused
        onlyOwner
    {
        _configuration.setInterestModel(interestModel);
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

    function setMaxDistributorFeeRatios(
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    ) external whenNotPaused onlyOwner {
        _configuration.setMaxDistributorFeeRatios(
            maxDepositDistributorFeeRatio,
            maxLoanDistributorFeeRatio
        );
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

    function getInterestModelAddress()
        external
        view
        whenNotPaused
        returns (address interestModel)
    {
        return address(_configuration.interestModel);
    }

    function getPriceOracleAddress()
        external
        view
        whenNotPaused
        returns (address priceOracleAddress)
    {
        return address(_configuration.priceOracle);
    }

    function getMaxDistributorFeeRatios()
        external
        view
        whenNotPaused
        returns (
            uint256 maxDepositDistributorFeeRatio,
            uint256 maxLoanDistributorFeeRatio
        )
    {
        return (
            _configuration.maxDepositDistributorFeeRatio,
            _configuration.maxLoanDistributorFeeRatio
        );
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
