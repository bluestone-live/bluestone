pragma solidity ^0.6.7;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '../oracle/interface/IPriceOracle.sol';
import './interface/IProtocol.sol';
import './interface/IInterestModel.sol';
import './lib/Configuration.sol';
import './lib/LiquidityPools.sol';
import './lib/DepositManager.sol';
import './lib/LoanManager.sol';

/// @title The main contract that exposes all external functions
/// @dev We can consider this contract as a master contract that contains no actual
/// business logic but enforces permission checks and delegates function calls to
/// corresponding libraries. Although contract states are defined in libraries,
/// they are initialized and stored in this contract.
contract Protocol is IProtocol, Ownable, Pausable, ReentrancyGuard {
    using Configuration for Configuration.State;
    using LiquidityPools for LiquidityPools.State;
    using DepositManager for DepositManager.State;
    using LoanManager for LoanManager.State;

    /// Initialize library instances
    Configuration.State _configuration;
    LiquidityPools.State _liquidityPools;
    DepositManager.State _depositManager;
    LoanManager.State _loanManager;

    event EnableDepositTermSucceed(address indexed adminAddress, uint256 term);

    event DisableDepositTermSucceed(address indexed adminAddress, uint256 term);

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

    event InterestReserveTransfered(
        address indexed accountAddress,
        bytes32 recordId,
        address indexed depositTokenAddress,
        uint256 interestForProtocolReserve
    );

    event DepositDistributorFeeTransfered(
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

    event LoanDistributorFeeTransfered(
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

    event SetInterestModelSucceed(
        address indexed adminAddress,
        address interestModelAddress
    );

    event SetProtocolReverveRatioSucceed(
        address indexed adminAddress,
        uint256 protocolReserveRatio
    );

    event SetMaxDistributionFeeRatiosSucceed(
        address indexed adminAddress,
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    );

    receive() external payable {
        revert();
    }

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
        _depositManager.enableDepositToken(tokenAddress);
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
        address payable distributorAddress
    ) external payable whenNotPaused nonReentrant override returns (bytes32 depositId) {
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
        override
        returns (uint256 withdrewAmount)
    {
        return
            _depositManager.earlyWithdraw(
                _liquidityPools,
                depositId
            );
    }

    function getDepositTerms()
        external
        view
        whenNotPaused
        override
        returns (uint256[] memory depositTermList)
    {
        return _depositManager.depositTermList;
    }

    function getDepositTokens()
        external
        view
        whenNotPaused
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

    function getMaxLoanTerm()
        external
        view
        override
        returns (uint256 maxLoanTerm)
    {
        return _liquidityPools.poolGroupSize;
    }

    function loan(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 loanTerm,
        address payable distributorAddress
    ) external payable whenNotPaused nonReentrant override returns (bytes32 loanId) {
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

    function liquidateLoan(bytes32 loanId, uint256 liquidateAmount)
        external
        payable
        whenNotPaused
        nonReentrant
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

    function addCollateral(
        bytes32 loanId,
        uint256 collateralAmount
    )
        external
        payable
        whenNotPaused
        override
        returns (uint256 totalCollateralAmount)
    {
        if (msg.value > 0) {
            return _loanManager.addCollateral(loanId, msg.value);
        } else {
            return _loanManager.addCollateral(loanId, collateralAmount);
        }
    }

    function subtractCollateral(
        bytes32 loanId,
        uint256 collateralAmount
    )
        external
        whenNotPaused
        override
        returns (uint256 totalCollateralAmount)
    {
        return _loanManager.subtractCollateral(_configuration, loanId, collateralAmount);
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

    function getPoolsByToken(address tokenAddress)
        external
        view
        whenNotPaused
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

    function getInterestReserveAddress()
        external
        view
        whenNotPaused
        override
        returns (address interestReserveAddress)
    {
        return _configuration.interestReserveAddress;
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
        whenNotPaused
        override
        returns (uint256 protocolReserveRatio)
    {
        return _configuration.protocolReserveRatio;
    }

    function getBalanceCap(address tokenAddress)
        external
        view
        whenNotPaused
        override
        returns (uint256 balanceCap)
    {
        return _configuration.balanceCapByToken[tokenAddress];
    }

    function pause() external whenNotPaused {
        _pause();
    }

    function unpause() external whenPaused {
        _unpause();
    }
}
