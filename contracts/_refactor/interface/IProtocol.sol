pragma solidity ^0.5.0;

import './IInterestModel.sol';

/// @title Interface for main protocol
/// TODO (ZhangRGK): change to interface after all method implement
contract IProtocol {
    /// --- Deposit ---

    /// @notice Enable a deposit term
    /// @param depositTerm Deposit term
    function enableDepositTerm(uint256 depositTerm) external;

    /// @notice Disable a deposit term
    /// @param depositTerm  Deposit term
    function disableDepositTerm(uint256 depositTerm) external;

    /// @notice Enable an ERC20 token for deposit
    /// @param tokenAddress Token address
    function enableDepositToken(address tokenAddress) external;

    /// @notice Disable an token, i.e., ERC20 token, for deposit
    /// @param tokenAddress Token address
    function disableDepositToken(address tokenAddress) external;

    /// @notice Update deposit maturity for each token
    /// @dev This function is executed by backend jobs every midnight
    function updateDepositMaturity() external;

    /// @notice Deposit token with specific term and amount
    /// @param tokenAddress Token address
    /// @param depositAmount Deposit amount
    /// @param depositTerm Deposit term
    /// @return depositId ID that identifies the deposit
    function deposit(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm
    ) external returns (bytes32 depositId);

    /// @notice Deposit token with specific term and amount
    /// @param tokenAddress Token address
    /// @param depositAmount Deposit amount
    /// @param depositTerm Deposit term
    /// @param distributorAddress distributor account address
    /// @param depositDistributorFeeRatio the ratio of interest that distributor will get
    /// @return depositId ID that identifies the deposit
    function deposit(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        address distributorAddress,
        uint256 depositDistributorFeeRatio
    ) external returns (bytes32 depositId);

    /// @notice Withdraw a deposit
    /// @param depositId Id that identifies the deposit
    /// @return withdrewAmount Total amount withdrew, including interest
    function withdraw(bytes32 depositId)
        external
        returns (uint256 withdrewAmount);

    /// @notice Early withdraw a deposit
    /// @param depositId Id that identifies the deposit
    /// @return withdrewAmount Total amount withdrew, not including interest
    function earlyWithdraw(bytes32 depositId)
        external
        returns (uint256 withdrewAmount);

    /// @notice Return enabled deposit terms
    /// @return depositTerms A list of enabled deposit terms
    function getDepositTerms()
        external
        view
        returns (uint256[] memory depositTerms);

    /// @notice Return details for each deposit token
    /// @return depositTokenAddressList A list of deposit tokens
    /// @return isEnabledList A list of boolean value indicates whether the token is enabled
    function getDepositTokens()
        external
        view
        returns (
            address[] memory depositTokenAddressList,
            bool[] memory isEnabledList
        );

    /// @notice Return details about a deposit
    /// @param depositId ID that identifies the deposit
    /// @return tokenAddress
    /// @return depositTerm
    /// @return depositAmount
    /// @return withdrewAmount
    /// @return protocolReserveRatio
    /// @return poolId
    /// @return createdAt
    /// @return maturedAt
    /// @return withdrewAt
    /// @return isMatured
    /// @return isWithdrawn
    function getDepositRecordById(bytes32 depositId)
        external
        view
        returns (
            address tokenAddress,
            uint256 depositTerm,
            uint256 depositAmount,
            uint256 withdrewAmount,
            uint256 protocolReserveRatio,
            uint256 poolId,
            uint256 createdAt,
            uint256 maturedAt,
            uint256 withdrewAt,
            bool isMatured,
            bool isWithdrawn
        );

    /// @notice Return interest earned by a deposit
    /// @param depositId ID that identifies the deposit
    /// @return interest
    function getDepositInterestById(bytes32 depositId)
        external
        view
        returns (uint256 interest);

    /// @notice Return details about all deposits
    /// @return depositIdList
    /// @return tokenAddressList
    /// @return depositTermList
    /// @return depositAmountList
    /// @return createdAtList
    /// @return maturedAtList
    /// @return withdrewAtList
    function getDepositRecordsByAccount(address accountAddress)
        external
        view
        returns (
            bytes32[] memory depositIdList,
            address[] memory tokenAddressList,
            uint256[] memory depositTermList,
            uint256[] memory depositAmountList,
            uint256[] memory createdAtList,
            uint256[] memory maturedAtList,
            uint256[] memory withdrewAtList
        );

    /// @notice Return whether a deposit can be early withdrew.
    /// @param depositId ID that identifies the deposit
    /// @return isEarlyWithdrawable
    function isDepositEarlyWithdrawable(bytes32 depositId)
        external
        view
        returns (bool isEarlyWithdrawable);

    /// --- Loan ---

    /// @notice Enable a loan and collateral token pair, e.g., ETH_DAI.
    /// @param loanTokenAddress Loan token address
    /// @param collateralTokenAddress Collateral token address
    function enableLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external;

    /// @notice Disable a loan and collateral token pair, e.g., ETH_DAI
    /// @param loanTokenAddress Loan token address
    /// @param collateralTokenAddress collateral token address
    function disableLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external;

    /// @notice Set minimum collateral coverage ratio for each loan and collateral token pair
    /// @param loanTokenAddress A loan token addresses
    /// @param collateralTokenAddressList A list of collateral token addresses
    /// @param minCollateralCoverageRatioList A list of minimum collateral coverage ratios
    function setMinCollateralCoverageRatiosForToken(
        address loanTokenAddress,
        address[] calldata collateralTokenAddressList,
        uint256[] calldata minCollateralCoverageRatioList
    ) external;

    /// @notice Set liquidation discount for each loan and collateral token pair
    /// @param loanTokenAddress A loan token addresses
    /// @param collateralTokenAddressList A list of collateral token addresses
    /// @param liquidationDiscountList A list of liquidation discounts
    function setLiquidationDiscountsForToken(
        address loanTokenAddress,
        address[] calldata collateralTokenAddressList,
        uint256[] calldata liquidationDiscountList
    ) external;

    /// @notice Borrow token in a specific term
    /// @param loanTokenAddress token to borrow
    /// @param collateralTokenAddress token to collateralize the loan
    /// @param loanAmount Amount to borrow
    /// @param collateralAmount Amount to collateralize
    /// @param loanTerm Loan term
    /// @param useFreedCollateral Whether to use freed collateral in user's account
    /// @param distributorAddress Distributor account address
    /// @return loanId ID that identifies the loan
    function loan(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 loanTerm,
        bool useFreedCollateral,
        address distributorAddress
    ) external returns (bytes32 loanId);

    /// @notice Pay back a specific amount of loan
    /// @param loanId ID that identifies the loan
    /// @param repayAmount Amount to repay
    /// @return remainingDebt remaining debt of the loan
    function repayLoan(bytes32 loanId, uint256 repayAmount)
        external
        returns (uint256 remainingDebt);

    /// @notice Liquidate a loan that is under-collateralized or defaulted
    /// @param loanId ID that identifies the loan
    /// @param liquidateAmount The amount requested to liquidate. If the amount
    ///        is greater than the remaining debt of the loan, it will
    ///        liquidate the full remaining debt.
    /// @return remainingCollateral The remaining amount of collateral after liquidation
    /// @return liuquidatedAmount The amount of debt that is liquidated.
    function liquidateLoan(bytes32 loanId, uint256 liquidateAmount)
        external
        returns (uint256 remainingCollateral, uint256 liquidatedAmount);

    /// @notice Add collateral to a loan
    /// @param loanId ID that identifies the loan
    /// @param collateralAmount The collateral amount to be added to the loan
    /// @return totalCollateralAmount The total collateral amount after adding collateral
    function addCollateral(
        bytes32 loanId,
        uint256 collateralAmount,
        bool useFreedCollateral
    ) external returns (uint256 totalCollateralAmount);

    /// @notice Withdraw freed collateral from caller's account
    /// @param tokenAddress The collateral token address
    /// @param collateralAmount The freed collateral amount
    function withdrawFreedCollateral(
        address tokenAddress,
        uint256 collateralAmount
    ) external;

    /// @notice Return amount of freed collateral for each token in caller's account
    /// @return tokenAddressList A list of token addresses
    /// @return freedCollateralAmountList A list of freed collateral amount for each token
    function getFreedCollateralsByAccount(address accountAddress)
        external
        view
        returns (
            address[] memory tokenAddressList,
            uint256[] memory freedCollateralAmountList
        );

    /// @notice Return details of a loan
    /// @param loanId ID that identifies the loan
    /// @return loanTokenAddress
    /// @return collateralTokenAddress
    /// @return loanTerm
    /// @return loanAmount
    /// @return collateralAmount
    /// @return interest
    /// @return remainingDebt
    /// @return createdAt
    /// @return isLiquidatable
    /// @return isOverDue
    /// @return isClose
    function getLoanRecordById(bytes32 loanId)
        external
        view
        returns (
            address loanTokenAddress,
            address collateralTokenAddress,
            uint256 loanTerm,
            uint256 loanAmount,
            uint256 collateralAmount,
            uint256 interest,
            uint256 remainingDebt,
            uint256 createdAt,
            uint256 currentCollateralRatio,
            bool isLiquidatable,
            bool isOverDue,
            bool isClosed
        );

    /// @notice Return details of all loans owned by the caller
    /// @return loanIdList
    /// @return loanTokenAddressList
    /// @return collateralTokenAddressList
    /// @return loanTermList
    /// @return loanAmountList
    /// @return collateralAmountList
    /// @return annualInterestRateList
    /// @return interestList
    /// @return minCollateralRatioList
    /// @return liquidationDiscountList
    /// @return alreadyPaidAmountList
    /// @return liquidatedAmountList
    /// @return soldCollateralAmountList
    /// @return remainingDebtList
    /// @return createdAtList
    /// @return lastInterestUpdatedAtList
    /// @return lastRepaidAtList
    /// @return lastLiquidatedAtList
    /// @return isLiquidatableList
    /// @return isOverDueList
    /// @return isCloseList
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
            uint256[] memory annualInterestRateList,
            uint256[] memory interestList,
            uint256[] memory minCollateralRatioList,
            uint256[] memory liquidationDiscountList,
            uint256[] memory alreadyPaidAmountList,
            uint256[] memory liquidatedAmountList,
            uint256[] memory soldCollateralAmountList,
            uint256[] memory remainingDebtList,
            uint256[] memory createdAtList,
            uint256[] memory lastInterestUpdatedAtList,
            uint256[] memory lastRepaidAtList,
            uint256[] memory lastLiquidatedAtList,
            bool[] memory isLiquidatableList,
            bool[] memory isOverDueList,
            bool[] memory isCloseList
        );

    /// @notice Return a list of enabled loan terms
    /// @return loanTermList A list of enabled loan terms
    function getLoanTerms()
        external
        view
        returns (uint256[] memory loanTermList);

    /// @notice Return details for each loan and collateral token pair
    /// @return loanTokenAddressList A list of loan token addresses
    /// @return collateralTokenAddressList A list of collateral token addresses
    /// @return isEnabledList A list of boolean value indicates whether the token pair is enabled
    /// @return minCollateralCoverageRatioList A list of minimum collateral coverage ratios
    /// @return liquidationDiscountList A list of liquidation discounts
    function getLoanAndCollateralTokenPairs()
        external
        view
        returns (
            address[] memory loanTokenAddressList,
            address[] memory collateralTokenAddressList,
            bool[] memory isEnabledList,
            uint256[] memory minCollateralCoverageRatioList,
            uint256[] memory liquidationDiscountList
        );

    /// @notice return token addresses for all loanable tokens
    /// @param tokenType Type flag, 0 for loan token and 1 for collateral token
    /// @return tokenAddressList A list of loan token addresses
    /// @return isActive A list that shows if the loan token is active now
    function getTokenAddressList(uint256 tokenType)
        external
        view
        returns (address[] memory tokenAddressList, bool[] memory isActive);

    /// @notice Return loan interest rates for each loan term for given token
    /// @return loanTerms A list of loan terms
    /// @return loanInterestRates A list of loan interest rates
    function getLoanInterestRateByToken(address tokenAddress)
        external
        view
        returns (
            uint256[] memory loanTerms,
            uint256[] memory loanInterestRates
        );

    /// --- Configuration ---

    /// @notice Set price oracle address
    /// @param priceOracleAddress Price oracle address
    function setPriceOracleAddress(address priceOracleAddress) external;

    /// @notice Set interest model
    /// @param interestModel Interest model
    function setInterestModel(IInterestModel interestModel) external;

    /// @notice Set protocol address, which receives protocol reserve.
    /// @param protocolAddress Protocol address
    function setProtocolAddress(address protocolAddress) external;

    /// @notice Set protocol reserve ratio, which determines the percentage
    ///         of interest that goes to protocol reserve.
    /// @param protocolReserveRatio Protocol reserve ratio
    function setProtocolReserveRatio(uint256 protocolReserveRatio) external;

    /// @notice Lock user actions
    function lockUserActions() external;

    /// @notice Unlock user actions
    function unlockUserActions() external;

    /// @notice Return price oracle address
    /// @return priceOracleAddress Price oracle address
    function getPriceOracleAddress()
        external
        view
        returns (address priceOracleAddress);

    /// @notice Return protocol address
    /// @return protocolAddress Protocol address
    function getProtocolAddress()
        external
        view
        returns (address protocolAddress);

    /// @notice Return protocol reserve ratio
    /// @return protocolReserveRatio Protocol reserve ratio
    function getProtocolReserveRatio()
        external
        view
        returns (uint256 protocolReserveRatio);

    /// @notice Set the maximum fee ratio for distributors
    /// @param maxDepositDistributorFeeRatio deposit distributor fee ratio
    /// @param maxLoanDistributorFeeRatio loan fee ratio
    function setMaxDistributorFeeRatios(
        uint256 maxDepositDistributorFeeRatio,
        uint256 maxLoanDistributorFeeRatio
    ) external;

    /// @notice Check if user actions are locked
    /// @param isLocked Return true if user actions are locked, else return false
    function isUserActionsLocked() external view returns (bool isLocked);

    /// --- Account ---

    /// @notice Return a specific general statistic for an account
    /// @param accountAddress Account address
    /// @param key The key to retrieve corresponding stat
    /// @return stat The statistical value
    function getAccountGeneralStat(address accountAddress, string calldata key)
        external
        view
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
    ) external view returns (uint256 stat);
}
