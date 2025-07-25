// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '../oracle/interface/IPriceOracle.sol';
import './interface/IProtocol.sol';
import './interface/IInterestRateModel.sol';
import './lib/Configuration.sol';
import './lib/LiquidityPools.sol';
import './lib/DepositManager.sol';
import './lib/LoanManager.sol';
import './Whitelist.sol';

/// @title The main contract that exposes all external functions
/// @dev We can consider this contract as a master contract that contains no actual
/// business logic but enforces permission checks and delegates function calls to
/// corresponding libraries. Although contract states are defined in libraries,
/// they are initialized and stored in this contract.
contract Protocol is IProtocol, Ownable, Pausable, ReentrancyGuard, Whitelist {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using DepositManager for DepositManager.State;
    using LoanManager for LoanManager.State;

    /// Initialize library instances
    Configuration.State _configuration;
    LiquidityPools.State _liquidityPools;
    DepositManager.State _depositManager;
    LoanManager.State _loanManager;

    /// Events
    event EnableDepositTermsSucceed(address indexed adminAddress, uint256[] terms);

    event DisableDepositTermsSucceed(address indexed adminAddress, uint256[] terms);

    event EnableDepositTokenSucceed(
        address indexed adminAddress,
        address tokenAddress
    );

    event DisableDepositTokenSucceed(
        address indexed adminAddress,
        address tokenAddress
    );

    event DepositSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed depositTokenAddress,
        uint256 amount
    );

    event WithdrawSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed depositTokenAddress,
        uint256 amount
    );

    event EarlyWithdrawSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed depositTokenAddress,
        uint256 amount
    );

    event InterestReserveTransferred(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed depositTokenAddress,
        uint256 interestForProtocolReserve
    );

    event DepositDistributorFeeTransferred(
        address indexed distributorAccountAddress,
        bytes32 recordId,
        address indexed depositTokenAddress,
        uint256 interestForDistributor
    );
    event PayDepositDistributorFailed(
        address indexed distributorAddress,
        bytes32 recordId,
        uint256 amount
    );

    event SetLoanAndCollateralTokenPairSucceed(
        address indexed adminAddress,
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 minCollateralCoverageRatio,
        uint256 liquidationDiscount
    );

    event RemoveLoanAndCollateralTokenPairSucceed(
        address indexed adminAddress,
        address loanTokenAddress,
        address collateralTokenAddress
    );

    event LoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed loanTokenAddress,
        uint256 loanAmount,
        address indexed collateralTokenAddress,
        uint256 collateralAmount
    );

    event RepayLoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed loanTokenAddress,
        uint256 repayAmount,
        address indexed collateralTokenAddress,
        uint256 returnedCollateralAmount,
        bool isFullyRepaid
    );

    event LiquidateLoanSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed loanTokenAddress,
        uint256 liquidateAmount,
        address indexed collateralTokenAddress,
        uint256 soldCollateralAmount
    );

    event LoanDistributorFeeTransferred(
        address indexed distributorAccountAddress,
        bytes32 recordId,
        address indexed loanTokenAddress,
        uint256 interestForLoanDistributor
    );

    event AddCollateralSucceed(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed collateralTokenAddress,
        uint256 collateralAmount
    );

    event SubtractCollateralSucceed(
        address indexed accountAddress,
        address indexed collateralTokenAddress,
        bytes32 recordId,
        uint256 collateralAmount
    );

    event PayLoanDistributorFailed(
        address indexed distributorAddress,
        bytes32 recordId,
        uint256 amount
    );

    event SetPriceOracleSucceed(
        address indexed adminAddress,
        address tokenAddress,
        address priceOracleAddress
    );

    event SetProtocolAddressSucceed(
        address indexed adminAddress,
        address protocolAddress
    );

    event SetInterestRateModelSucceed(
        address indexed adminAddress,
        address interestRateModelAddress
    );

    event SetProtocolReserveRatioSucceed(
        address indexed adminAddress,
        uint256 protocolReserveRatio
    );

    event SetMaxDistributionFeeRatiosSucceed(
        address indexed adminAddress,
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    );

    /// Prevent direct transfer to the contract.
    receive() external payable {
        revert();
    }

    /// Admin functions
    function pause() external onlyOwner whenNotPaused override {
        _pause();
    }

    function unpause() external onlyOwner whenPaused override {
        _unpause();
    }

    function enableDepositTerm(uint256 term) external onlyOwner override {
        _depositManager.enableDepositTerm(_liquidityPools, term);
    }

    function enableDepositTerms(uint256[] calldata terms) external onlyOwner override {
        _depositManager.enableDepositTerms(_liquidityPools, terms);
    }

    function disableDepositTerm(uint256 term) external onlyOwner override {
        _depositManager.disableDepositTerm(term);
    }

    function disableDepositTerms(uint256[] calldata terms) external onlyOwner override {
        _depositManager.disableDepositTerms(terms);
    }

    function enableDepositToken(address tokenAddress)
        external
        onlyOwner
        override
    {
        _depositManager.enableDepositToken(tokenAddress);
    }

    function disableDepositToken(address tokenAddress)
        external
        onlyOwner
        override
    {
        _depositManager.disableDepositToken(tokenAddress);
    }

    function setLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 minCollateralCoverageRatio,
        uint256 liquidationDiscount
    ) external onlyOwner override {
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
    ) external onlyOwner override {
        _loanManager.removeLoanAndCollateralTokenPair(
            loanTokenAddress,
            collateralTokenAddress
        );
    }

    function setPriceOracle(address tokenAddress, IPriceOracle priceOracle)
        external
        onlyOwner
        override
    {
        _configuration.setPriceOracle(tokenAddress, priceOracle);
    }

    function setInterestRateModel(IInterestRateModel interestRateModel)
        external
        onlyOwner
        override
    {
        _configuration.setInterestRateModel(interestRateModel);
    }

    function setInterestReserveAddress(address payable interestReserveAddress)
        external
        onlyOwner
        override
    {
        _configuration.setInterestReserveAddress(interestReserveAddress);
    }

    function setProtocolReserveRatio(uint256 protocolReserveRatio)
        external
        onlyOwner
        override
    {
        _configuration.setProtocolReserveRatio(protocolReserveRatio);
    }

    function setMaxDistributorFeeRatios(
        uint256 depositDistributorFeeRatio,
        uint256 loanDistributorFeeRatio
    ) external onlyOwner override {
        _configuration.setMaxDistributorFeeRatios(
            depositDistributorFeeRatio,
            loanDistributorFeeRatio
        );
    }

    function setBalanceCap(
        address tokenAddress,
        uint256 balanceCap
    ) external onlyOwner override {
        _configuration.setBalanceCap(
            tokenAddress,
            balanceCap
        );
    }

    /// Lender functions
    function deposit(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        address payable distributorAddress
    ) external payable whenNotPaused nonReentrant onlyWhitelistedLender override returns (bytes32 depositId) {
        IStruct.DepositParameters memory depositParameters = IStruct.DepositParameters({
            tokenAddress: tokenAddress,
            depositAmount: depositAmount,
            depositTerm: depositTerm,
            distributorAddress: distributorAddress
        });

        return
            _depositManager.deposit(
                _liquidityPools,
                _configuration,
                depositParameters
            );
    }

    function withdraw(bytes32 depositId)
        external
        whenNotPaused
        nonReentrant
        onlyWhitelistedLender
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
        nonReentrant
        onlyWhitelistedLender
        override
        returns (uint256 withdrewAmount)
    {
        return
            _depositManager.earlyWithdraw(
                _liquidityPools,
                depositId
            );
    }

    /// Borrower functions
    function loan(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 loanTerm,
        address payable distributorAddress
    ) external payable whenNotPaused nonReentrant onlyWhitelistedBorrower override returns (bytes32 loanId) {
        IStruct.LoanParameters memory loanParameters = IStruct.LoanParameters({
            loanTokenAddress: loanTokenAddress,
            collateralTokenAddress: collateralTokenAddress,
            loanAmount: loanAmount,
            collateralAmount: collateralAmount,
            loanTerm: loanTerm,
            distributorAddress: distributorAddress
        });

        loanId = _loanManager.loan(
            _configuration,
            _liquidityPools,
            loanParameters
        );

        return loanId;
    }

    function repayLoan(bytes32 loanId, uint256 repayAmount)
        external
        payable
        whenNotPaused
        nonReentrant
        onlyWhitelistedBorrower
        override
        returns (uint256 remainingDebt)
    {
        return
            _loanManager.repayLoan(
                _liquidityPools,
                loanId,
                repayAmount
            );
    }

    function addCollateral(
        bytes32 loanId,
        uint256 collateralAmount
    )
        external
        payable
        whenNotPaused
        onlyWhitelistedBorrower
        override
        returns (uint256 totalCollateralAmount)
    {
        return _loanManager.addCollateral(loanId, collateralAmount);
    }

    function subtractCollateral(
        bytes32 loanId,
        uint256 collateralAmount
    )
        external
        whenNotPaused
        onlyWhitelistedBorrower
        override
        returns (uint256 totalCollateralAmount)
    {
        return _loanManager.subtractCollateral(_configuration, loanId, collateralAmount);
    }

    /// Liquidator functions
    function liquidateLoan(bytes32 loanId, uint256 liquidateAmount)
        external
        payable
        whenNotPaused
        nonReentrant
        onlyWhitelistedKeeper
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

    /// Getters about deposit
    function getDepositTerms()
        external
        view
        override
        returns (uint256[] memory depositTermList)
    {
        return _depositManager.depositTermList;
    }

    function getDepositTokens()
        external
        view
        override
        returns (address[] memory depositTokenAddressList)
    {
        return _depositManager.depositTokenAddressList;
    }

    function getDepositRecordById(bytes32 depositId)
        external
        view
        override
        returns (IStruct.GetDepositRecordResponse memory depositRecord)
    {
        return _depositManager.getDepositRecordById(_liquidityPools, depositId);
    }

    function getDepositRecordsByAccount(address accountAddress)
        external
        view
        override
        returns (IStruct.GetDepositRecordResponse[] memory depositRecordList)
    {
        return _depositManager.getDepositRecordsByAccount(_liquidityPools, accountAddress);
    }

    function isDepositEarlyWithdrawable(bytes32 depositId)
        external
        view
        override
        returns (bool isEarlyWithdrawable)
    {
        return
            _depositManager.isDepositEarlyWithdrawable(
                _liquidityPools,
                depositId
            );
    }

    /// Getters about loan
    function getLoanAndCollateralTokenPairs()
        external
        view
        override
        returns (
            IStruct.LoanAndCollateralTokenPair[] memory loanAndCollateralTokenPairList
        )
    {
        return _loanManager.getLoanAndCollateralTokenPairs();
    }

    function getMaxLoanTerm()
        external
        view
        override
        returns (uint256 maxLoanTerm)
    {
        return _liquidityPools.poolGroupSize;
    }

    function getLoanInterestRate(address tokenAddress, uint256 term)
        external
        view
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

    function getLoanRecordById(bytes32 loanId)
        external
        view
        override
        returns (IStruct.GetLoanRecordResponse memory loanRecord)
    {
        return _loanManager.getLoanRecordById(_configuration, loanId);
    }

    function getLoanRecordsByAccount(address accountAddress)
        external
        view
        override
        returns (IStruct.GetLoanRecordResponse[] memory loanRecordList)
    {
        return _loanManager.getLoanRecordsByAccount(_configuration, accountAddress);
    }

    /// Getters about liquidity pools
    function getPoolsByToken(address tokenAddress)
        external
        view
        override
        returns (IStruct.GetPoolsByTokenResponse[] memory poolList)
    {
        return _liquidityPools.getPoolsByToken(tokenAddress);
    }

    function getPoolById(address tokenAddress, uint256 poolId)
        external
        view
        override
        returns (IStruct.Pool memory pool)
    {
        return _liquidityPools.getPoolById(tokenAddress, poolId);
    }

    /// Miscellaneous functions
    function getBalanceCap(address tokenAddress)
        external
        view
        override
        returns (uint256 balanceCap)
    {
        return _configuration.balanceCapByToken[tokenAddress];
    }

    function getInterestRateModelAddress()
        external
        view
        override
        returns (address interestRateModelAddress)
    {
        return address(_configuration.interestRateModel);
    }

    function getTokenPrice(address tokenAddress)
        external
        view
        override
        returns (uint256 tokenPrice)
    {
        return _configuration.priceOracleByToken[tokenAddress].getPrice();
    }

    function getMaxDistributorFeeRatios()
        external
        view
        override
        returns (
            uint256 depositDistributorFeeRatio,
            uint256 loanDistributorFeeRatio
        )
    {
        return (
            _configuration.depositDistributorFeeRatio,
            _configuration.loanDistributorFeeRatio
        );
    }

    function getProtocolReserveRatio()
        external
        view
        override
        returns (uint256 protocolReserveRatio)
    {
        return _configuration.protocolReserveRatio;
    }

    function getInterestReserveAddress()
        external
        view
        override
        returns (address interestReserveAddress)
    {
        return _configuration.interestReserveAddress;
    }
}