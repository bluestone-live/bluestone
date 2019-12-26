pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './Ownable.sol';
import './Pausable.sol';
import '../interface/IProtocol.sol';
import '../interface/IPriceOracle.sol';
import '../interface/IInterestModel.sol';
import '../interface/IStruct.sol';
import './lib/Configuration.sol';
import './lib/LiquidityPools.sol';
import './lib/DepositManager.sol';
import './lib/LoanManager.sol';
import './lib/AccountManager.sol';

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

    event DepositSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        uint256 amount
    );
    event WithdrawSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        uint256 amount
    );
    event LoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        uint256 amount
    );
    event RepayLoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        uint256 amount
    );
    event LiquidateLoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        uint256 amount
    );
    event WithdrawAvailableCollateralSucceed(
        address indexed accountAddress,
        uint256 amount
    );
    event AddCollateralSucceed(
        address indexed accountAddress,
        bytes32 indexed recordId,
        uint256 collateralAmount
    );

    /// --- Deposit Configurations---

    function enableDepositTerm(uint256 term) external onlyOwner override {
        _depositManager.enableDepositTerm(_liquidityPools, term);
    }

    function disableDepositTerm(uint256 term) external onlyOwner override {
        _depositManager.disableDepositTerm(term);
    }

    function enableDepositToken(address tokenAddress)
        external
        onlyOwner
        override
    {
        _depositManager.enableDepositToken(_liquidityPools, tokenAddress);
    }

    function disableDepositToken(address tokenAddress)
        external
        onlyOwner
        override
    {
        _depositManager.disableDepositToken(tokenAddress);
    }

    function deposit(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        address distributorAddress
    ) external whenNotPaused override returns (bytes32 depositId) {
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
        whenNotPaused
        override
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
        whenNotPaused
        override
        returns (uint256 withdrewAmount)
    {
        return _depositManager.earlyWithdraw(_liquidityPools, depositId);
    }

    function getDepositTerms()
        external
        view
        whenNotPaused
        override
        returns (uint256[] memory depositTermList)
    {
        return _depositManager.enabledDepositTermList;
    }

    function getDepositTokens()
        external
        view
        whenNotPaused
        override
        returns (address[] memory depositTokenAddressList)
    {
        return _depositManager.enabledDepositTokenAddressList;
    }

    /// --- Deposit

    function getDepositRecordById(bytes32 depositId)
        external
        view
        whenNotPaused
        override
        returns (IStruct.DepositRecord memory depositRecord)
    {
        return _depositManager.getDepositRecordById(depositId);
    }

    function getInterestDistributionByDepositId(bytes32 depositId)
        external
        view
        override
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
        whenNotPaused
        override
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
        override
        returns (bool isEarlyWithdrawable)
    {
        return
            _depositManager.isDepositEarlyWithdrawable(
                _liquidityPools,
                depositId
            );
    }

    /// --- Loan

    function getMaxLoanTerm(address tokenAddress)
        external
        view
        override
        returns (uint256 maxLoanTerm)
    {
        return _liquidityPools.poolGroups[tokenAddress].numPools;
    }

    function loan(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 loanTerm,
        bool useAvailableCollateral,
        address distributorAddress
    ) external whenNotPaused override returns (bytes32 loanId) {
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
        override
        returns (uint256 remainingDebt)
    {
        return _loanManager.repayLoan(_liquidityPools, loanId, repayAmount);
    }

    function liquidateLoan(bytes32 loanId, uint256 liquidateAmount)
        external
        whenNotPaused
        override
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
    ) external whenNotPaused override {
        _loanManager.withdrawAvailableCollateral(
            tokenAddress,
            collateralAmount
        );
    }

    function getAvailableCollateralsByAccount(address accountAddress)
        external
        view
        whenNotPaused
        override
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
        override
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
        override
        returns (uint256)
    {
        return _accountManager.getAccountGeneralStat(accountAddress, key);
    }

    function getAccountTokenStat(
        address accountAddress,
        address tokenAddress,
        string calldata key
    ) external view whenNotPaused override returns (uint256) {
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
        override
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
        override
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
        override
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
    ) external whenNotPaused override returns (uint256 totalCollateralAmount) {
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
    ) external onlyOwner override {
        _loanManager.enableLoanAndCollateralTokenPair(
            loanTokenAddress,
            collateralTokenAddress
        );
    }

    function disableLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external onlyOwner override {
        _loanManager.disableLoanAndCollateralTokenPair(
            loanTokenAddress,
            collateralTokenAddress
        );
    }

    function setMinCollateralCoverageRatiosForToken(
        address loanTokenAddress,
        address[] calldata collateralTokenAddressList,
        uint256[] calldata minCollateralCoverageRatioList
    ) external onlyOwner override {
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
    ) external onlyOwner override {
        _loanManager.setLiquidationDiscountsForToken(
            loanTokenAddress,
            collateralTokenAddressList,
            liquidationDiscountList
        );
    }

    function getLoanAndCollateralTokenPairs()
        external
        view
        override
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
        override
        returns (address[] memory tokenAddressList, bool[] memory isActive)
    {
        return _loanManager.getTokenAddressList(tokenType);
    }

    /// --- LiquidityPools ---

    function getDetailsFromAllPools(address tokenAddress)
        external
        view
        whenNotPaused
        override
        returns (
            uint256[] memory poolIdList,
            uint256[] memory depositAmountList,
            uint256[] memory availableAmountList,
            uint256[] memory loanInterestList,
            uint256[] memory totalDepositWeightList
        )
    {
        return _liquidityPools.getDetailsFromAllPools(tokenAddress);
    }

    /// --- Configuration ---
    function setPriceOracle(address tokenAddress, IPriceOracle priceOracle)
        external
        onlyOwner
        override
    {
        _configuration.setPriceOracle(tokenAddress, priceOracle);
    }

    function setInterestModel(IInterestModel interestModel)
        external
        onlyOwner
        override
    {
        _configuration.setInterestModel(interestModel);
    }

    function setProtocolAddress(address protocolAddress)
        external
        onlyOwner
        override
    {
        _configuration.setProtocolAddress(protocolAddress);
    }

    function setProtocolReserveRatio(uint256 protocolReserveRatio)
        external
        onlyOwner
        override
    {
        _configuration.setProtocolReserveRatio(protocolReserveRatio);
    }

    function setMaxDistributorFeeRatios(
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    ) external onlyOwner override {
        _configuration.setMaxDistributorFeeRatios(
            maxDepositDistributorFeeRatio,
            maxLoanDistributorFeeRatio
        );
    }

    function getProtocolAddress()
        external
        view
        whenNotPaused
        override
        returns (address protocolAddress)
    {
        return _configuration.protocolAddress;
    }

    function getInterestModelAddress()
        external
        view
        whenNotPaused
        override
        returns (address interestModelAddress)
    {
        return address(_configuration.interestModel);
    }

    function getTokenPrice(address tokenAddress)
        external
        view
        whenNotPaused
        override
        returns (uint256 tokenPrice)
    {
        return _configuration.priceOracleByToken[tokenAddress].getPrice();
    }

    function getMaxDistributorFeeRatios()
        external
        view
        whenNotPaused
        override
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
        override
        returns (uint256 protocolReserveRatio)
    {
        return _configuration.protocolReserveRatio;
    }
}
