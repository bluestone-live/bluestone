pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './IInterestModel.sol';
import './IPriceOracle.sol';
import './IStruct.sol';
import './IPayableProxy.sol';

/// @title Interface for main protocol
interface IProtocol {
    /// --- Deposit ---

    /// @notice Enable a deposit term
    /// @param depositTerm Deposit term
    function enableDepositTerm(uint256 depositTerm) external virtual;

    /// @notice Disable a deposit term
    /// @param depositTerm  Deposit term
    function disableDepositTerm(uint256 depositTerm) external virtual;

    /// @notice Enable an ERC20 token for deposit
    /// @param tokenAddress Token address
    function enableDepositToken(address tokenAddress) external virtual;

    /// @notice Disable an token, i.e., ERC20 token, for deposit
    /// @param tokenAddress Token address
    function disableDepositToken(address tokenAddress) external virtual;

    /// @notice Deposit token with specific term and amount
    /// @param tokenAddress Token address
    /// @param depositAmount Deposit amount
    /// @param depositTerm Deposit term
    /// @param distributorAddress distributor account address
    /// @return depositId ID that identifies the deposit
    function deposit(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        address payable distributorAddress
    ) external payable virtual returns (bytes32 depositId);

    /// @notice Withdraw a deposit
    /// @param depositId Id that identifies the deposit
    /// @return withdrewAmount Total amount withdrew, including interest
    function withdraw(bytes32 depositId)
        external
        virtual
        returns (uint256 withdrewAmount);

    /// @notice Early withdraw a deposit
    /// @param depositId Id that identifies the deposit
    /// @return withdrewAmount Total amount withdrew, not including interest
    function earlyWithdraw(bytes32 depositId)
        external
        virtual
        returns (uint256 withdrewAmount);

    /// @notice Return enabled deposit terms
    /// @return depositTerms A list of enabled deposit terms
    function getDepositTerms()
        external
        view
        virtual
        returns (uint256[] memory depositTerms);

    /// @notice Return details for each deposit token
    /// @return depositTokenAddressList A list of deposit tokens
    function getDepositTokens()
        external
        view
        virtual
        returns (address[] memory depositTokenAddressList);

    /// @notice Return details about a deposit
    /// @param depositId ID that identifies the deposit
    /// @return depositRecord
    function getDepositRecordById(bytes32 depositId)
        external
        view
        virtual
        returns (IStruct.DepositRecord memory depositRecord);

    /// @notice Return interest distributed to different parties
    /// @param depositId ID that identifies the deposit
    /// @return interestForDepositor
    /// @return interestForDepositDistributor
    /// @return interestForLoanDistributor
    /// @return interestForProtocolReserve
    function getInterestDistributionByDepositId(bytes32 depositId)
        external
        view
        virtual
        returns (
            uint256 interestForDepositor,
            uint256 interestForDepositDistributor,
            uint256 interestForLoanDistributor,
            uint256 interestForProtocolReserve
        );

    /// @notice Return details about all deposits
    /// @return depositRecordList
    function getDepositRecordsByAccount(address accountAddress)
        external
        view
        virtual
        returns (IStruct.DepositRecord[] memory depositRecordList);

    /// @notice Return whether a deposit can be early withdrew.
    /// @param depositId ID that identifies the deposit
    /// @return isEarlyWithdrawable
    function isDepositEarlyWithdrawable(bytes32 depositId)
        external
        view
        virtual
        returns (bool isEarlyWithdrawable);

    /// --- Loan ---

    /// @notice Enable a loan and collateral token pair, e.g., ETH_DAI.
    /// @param loanTokenAddress Loan token address
    /// @param collateralTokenAddress Collateral token address
    function enableLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external virtual;

    /// @notice Disable a loan and collateral token pair, e.g., ETH_DAI
    /// @param loanTokenAddress Loan token address
    /// @param collateralTokenAddress collateral token address
    function disableLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external virtual;

    /// @dev Remove documentation of return parameters in order to compile
    /// @notice Get maximum loan term of a token
    /// @param tokenAddress Token address
    /// @return maxLoanTerm
    function getMaxLoanTerm(address tokenAddress)
        external
        view
        virtual
        returns (uint256 maxLoanTerm);

    /// @notice Set minimum collateral coverage ratio for each loan and collateral token pair
    /// @param loanTokenAddress A loan token addresses
    /// @param collateralTokenAddressList A list of collateral token addresses
    /// @param minCollateralCoverageRatioList A list of minimum collateral coverage ratios
    function setMinCollateralCoverageRatiosForToken(
        address loanTokenAddress,
        address[] calldata collateralTokenAddressList,
        uint256[] calldata minCollateralCoverageRatioList
    ) external virtual;

    /// @notice Set liquidation discount for each loan and collateral token pair
    /// @param loanTokenAddress A loan token addresses
    /// @param collateralTokenAddressList A list of collateral token addresses
    /// @param liquidationDiscountList A list of liquidation discounts
    function setLiquidationDiscountsForToken(
        address loanTokenAddress,
        address[] calldata collateralTokenAddressList,
        uint256[] calldata liquidationDiscountList
    ) external virtual;

    /// @notice Borrow token in a specific term
    /// @param loanTokenAddress token to borrow
    /// @param collateralTokenAddress token to collateralize the loan
    /// @param loanAmount Amount to borrow
    /// @param collateralAmount Amount to collateralize
    /// @param loanTerm Loan term
    /// @param distributorAddress Distributor account address
    /// @return loanId ID that identifies the loan
    function loan(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 loanTerm,
        address payable distributorAddress
    ) external payable virtual returns (bytes32 loanId);

    /// @notice Pay back a specific amount of loan
    /// @param loanId ID that identifies the loan
    /// @param repayAmount Amount to repay
    /// @return remainingDebt remaining debt of the loan
    function repayLoan(bytes32 loanId, uint256 repayAmount)
        external
        virtual
        returns (uint256 remainingDebt);

    /// @notice Liquidate a loan that is under-collateralized or defaulted
    /// @param loanId ID that identifies the loan
    /// @param liquidateAmount The amount requested to liquidate. If the amount
    ///        is greater than the remaining debt of the loan, it will
    ///        liquidate the full remaining debt.
    /// @return remainingCollateral The remaining amount of collateral after liquidation
    /// @return liquidatedAmount The amount of debt that is liquidated.
    function liquidateLoan(bytes32 loanId, uint256 liquidateAmount)
        external
        virtual
        returns (uint256 remainingCollateral, uint256 liquidatedAmount);

    /// @notice Add collateral to a loan
    /// @param loanId ID that identifies the loan
    /// @param collateralAmount The collateral amount to be added to the loan
    /// @return totalCollateralAmount The total collateral amount after adding collateral
    function addCollateral(bytes32 loanId, uint256 collateralAmount)
        external
        payable
        virtual
        returns (uint256 totalCollateralAmount);

    /// @notice Return basic info of a loan record
    /// @param loanId ID that identifies the loan record
    /// @return loanRecord
    function getLoanRecordById(bytes32 loanId)
        external
        view
        virtual
        returns (IStruct.LoanRecord memory loanRecord);

    /// @notice Return extra details of a loan record
    /// @param loanId ID that identifies the loan record
    /// @return remainingDebt
    /// @return currentCollateralRatio
    /// @return isLiquidatable
    /// @return isOverDue
    /// @return isClosed
    function getLoanRecordDetailsById(bytes32 loanId)
        external
        view
        virtual
        returns (
            uint256 remainingDebt,
            uint256 currentCollateralRatio,
            bool isLiquidatable,
            bool isOverDue,
            bool isClosed
        );

    /// @notice Return details of all loans owned by the caller
    /// @return loanRecordList
    function getLoanRecordsByAccount(address accountAddress)
        external
        view
        virtual
        returns (IStruct.LoanRecord[] memory loanRecordList);

    /// @notice Return details for each loan and collateral token pair
    /// @return loanAndCollateralTokenPairList A list of loan and collateral token pairs
    function getLoanAndCollateralTokenPairs()
        external
        view
        virtual
        returns (
            IStruct.LoanAndCollateralTokenPair[] memory loanAndCollateralTokenPairList
        );

    /// @notice return token addresses for all loanable tokens
    /// @param tokenType Type flag, 0 for loan token and 1 for collateral token
    /// @return tokenAddressList A list of loan token addresses
    /// @return isActive A list that shows if the loan token is active now
    function getTokenAddressList(uint256 tokenType)
        external
        view
        virtual
        returns (address[] memory tokenAddressList, bool[] memory isActive);

    /// @notice Return loan interest rate for given token
    /// @return loanInterestRate loan interest rate
    function getLoanInterestRate(address tokenAddress, uint256 term)
        external
        view
        virtual
        returns (uint256 loanInterestRate);

    /// --- Configuration ---

    function getPoolsByToken(address tokenAddress)
        external
        view
        virtual
        returns (IStruct.Pool[] memory poolList);

    /// @notice Set price oracle address
    /// @param tokenAddress Token address
    /// @param priceOracle Price oracle
    function setPriceOracle(address tokenAddress, IPriceOracle priceOracle)
        external
        virtual;

    /// @notice Set interest model
    /// @param interestModel Interest model
    function setInterestModel(IInterestModel interestModel) external virtual;

    /// @notice Set payable proxy
    /// @param payableProxy Payable proxy
    function setPayableProxy(IPayableProxy payableProxy) external virtual;

    /// @notice Set protocol address, which receives protocol reserve.
    /// @param protocolAddress Protocol address
    function setProtocolAddress(address payable protocolAddress)
        external
        virtual;

    /// @notice Set protocol reserve ratio, which determines the percentage
    ///         of interest that goes to protocol reserve.
    /// @param protocolReserveRatio Protocol reserve ratio
    function setProtocolReserveRatio(uint256 protocolReserveRatio)
        external
        virtual;

    /// @notice Return USD price of a token
    /// @param tokenAddress Token address
    /// @return tokenPrice Token price in USD
    function getTokenPrice(address tokenAddress)
        external
        view
        virtual
        returns (uint256 tokenPrice);

    /// @notice Return protocol address
    /// @return protocolAddress Protocol address
    function getProtocolAddress()
        external
        view
        virtual
        returns (address protocolAddress);

    /// @notice Return interest model address
    /// @return interestModelAddress Interest model address
    function getInterestModelAddress()
        external
        view
        virtual
        returns (address interestModelAddress);

    /// @notice Return protocol reserve ratio
    /// @return protocolReserveRatio Protocol reserve ratio
    function getProtocolReserveRatio()
        external
        view
        virtual
        returns (uint256 protocolReserveRatio);

    /// @notice Return the maximum fee ratio for distributors
    /// @return maxDepositDistributorFeeRatio
    /// @return maxLoanDistributorFeeRatio
    function getMaxDistributorFeeRatios()
        external
        view
        virtual
        returns (
            uint256 maxDepositDistributorFeeRatio,
            uint256 maxLoanDistributorFeeRatio
        );

    /// @notice Set the maximum fee ratio for distributors
    /// @param maxDepositDistributorFeeRatio deposit distributor fee ratio
    /// @param maxLoanDistributorFeeRatio loan fee ratio
    function setMaxDistributorFeeRatios(
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    ) external virtual;

    /// --- Account ---

    /// @notice Return a specific general statistic for an account
    /// @param accountAddress Account address
    /// @param key The key to retrieve corresponding stat
    /// @return stat The statistical value
    function getAccountGeneralStat(address accountAddress, string calldata key)
        external
        view
        virtual
        returns (uint256 stat);

    /// @notice Return a token-specific statistic for an account
    /// @param accountAddress Account address
    /// @param tokenAddress Token address
    /// @param key The key to retrieve corresponding stat
    /// @return stat The statistical value
    function getAccountTokenStat(
        address accountAddress,
        address tokenAddress,
        string calldata key
    ) external view virtual returns (uint256 stat);
}
