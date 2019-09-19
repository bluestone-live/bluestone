pragma solidity ^0.5.0;

/// @title Interface for main protocol
contract IProtocol {
    /// --- Deposit ---

    /// @notice Enable a deposit term
    /// @param depositTerm Deposit term
    function enableDepositTerm(uint depositTerm) external;

    /// @notice Disable a deposit term
    /// @param depositTerm  Deposit term
    function disableDepositTerm(uint depositTerm) external;

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
        uint depositAmount,
        uint depositTerm
    )
        external
        returns (bytes32 depositId);

    /// @notice Withdraw a deposit
    /// @param depositId Id that identifies the deposit
    /// @return withdrewAmount Total amount withdrew, including interest
    function withdraw(bytes32 depositId) external returns (uint withdrewAmount);

    /// @notice Return enabled deposit terms
    /// @return depositTerms A list of enabled deposit terms
    function getDepositTerms() external view returns (uint[] memory depositTerms);

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

    /// @notice Return details about a deposit owned by the caller
    /// @param depositId ID that identifies the deposit
    /// @return tokenAddress
    /// @return depositTerm
    /// @return depositAmount
    /// @return withdrewAmount
    /// @return protocolReserveRatio
    /// @return interestIndex
    /// @return poolId
    /// @return createdAt
    /// @return maturedAt
    /// @return withdrewAt
    /// @return isMatured
    /// @return isWithdrawn
    function getDeposit(
        bytes32 depositId
    )
        external
        view
        returns (
            address tokenAddress,
            uint depositTerm,
            uint depositAmount,
            uint withdrewAmount,
            uint protocolReserveRatio,
            uint interestIndex,
            uint poolId,
            uint createdAt,
            uint maturedAt,
            uint withdrewAt,
            bool isMatured,
            bool isWithdrawn
        );

    /// @notice Return details about all deposits owned by the caller
    /// @return depositIdList
    /// @return tokenAddressList
    /// @return depositTermList
    /// @return depositAmountList
    /// @return withdrewAmountList
    /// @return protocolReserveRatioList
    /// @return interestIndexList
    /// @return poolIdList
    /// @return createdAtList
    /// @return maturedAtList
    /// @return withdrewAtList
    /// @return isMaturedList
    /// @return isWithdrawnList
    function getDeposits()
        external
        view
        returns (
            bytes32[] memory depositIdList,
            address[] memory tokenAddressList,
            uint[] memory depositTermList,
            uint[] memory depositAmountList,
            uint[] memory withdrewAmountList,
            uint[] memory protocolReserveRatioList,
            uint[] memory interestIndexList,
            uint[] memory poolIdList,
            uint[] memory createdAtList,
            uint[] memory maturedAtList,
            uint[] memory withdrewAtList,
            bool[] memory isMaturedList,
            bool[] memory isWithdrawList
        );

    /// --- Loan ---

    /// @notice Add a loan term
    /// @param loanTerm Loan term
    function addLoanTerm(uint loanTerm) external;

    /// @notice Remove a loan term
    /// @param loanTerm Loan term
    function removeLoanTerm(uint loanTerm) external;

    /// @notice Enable a loan and collateral token pair, e.g., ETH_DAI.
    /// @param loanTokenAddress Loan token address
    /// @param collateralTokenAddress Collateral token address
    function enableLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    )
        external;

    /// @notice Disable a loan and collateral token pair, e.g., ETH_DAI
    /// @param loanTokenAddress Loan token address
    /// @param collateralTokenAddress collateral token address
    function disableLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    )
        external;

    /// @notice Set collateral coverage ratio for each loan and collateral token pair
    /// @param loanTokenAddressList A list of loan token addresses
    /// @param collateralTokenAddressList A list of collateral token addresses
    /// @param collateralCoverageRatioList A list of collateral coverage ratios
    function setCollateralCoverageRatios(
        address[] calldata loanTokenAddressList,
        address[] calldata collateralTokenAddressList,
        uint[] calldata collateralCoverageRatioList
    )
        external;

    /// @notice Set liquidation discount for each loan and collateral token pair
    /// @param loanTokenAddressList A list of loan token addresses
    /// @param collateralTokenAddressList A list of collateral token addresses
    /// @param liquidationDiscountList A list of liquidation discounts
    function setLiquidationDiscounts(
        address[] calldata loanTokenAddressList,
        address[] calldata collateralTokenAddressList,
        uint[] calldata liquidationDiscountList
    )
        external;

    /// @notice Set loan interest rate for each token and loan term
    /// @param tokenAddressList A list of token addresses
    /// @param loanTerms A list of loan terms
    /// @param loanInterestRateList A list of loan interest rates
    function setLoanInterestRates(
        address[] calldata tokenAddressList,
        uint[] calldata loanTerms,
        uint[] calldata loanInterestRateList
    )
        external;

    /// @notice Borrow token in a specific term
    /// @param loanTokenAddress token to borrow
    /// @param collateralTokenAddress token to collateralize the loan
    /// @param loanAmount Amount to borrow
    /// @param collateralAmount Amount to collateralize
    /// @param term Loan term
    /// @param useFreedCollateral Whether to use freed collateral in user's account
    /// @return loanId ID that identifies the loan
    function loan(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint loanAmount,
        uint collateralAmount,
        uint term,
        bool useFreedCollateral
    )
        external
        returns (bytes32 loanId);

    /// @notice Pay back a specific amount of loan
    /// @param loanId ID that identifies the loan
    /// @param repayAmount Amount to repay
    function repayLoan(bytes32 loanId, uint repayAmount) external;

    /// @notice Liquidate a loan that is under-collateralized or defaulted
    /// @param loanId ID that identifies the loan
    /// @param liquidateAmount The amount requested to liquidate. If the amount
    ///        is greater than the remaining debt of the loan, it will
    ///        liquidate the full remaining debt.
    /// @return liquidatedAmount The amount actually get liqudiated
    function liquidateLoan(
        bytes32 loanId,
        uint liquidateAmount
    )
        external
        returns (uint liquidatedAmount);

    /// @notice Add collateral to a loan
    /// @param loanId ID that identifies the loan
    /// @param collateralAmount The collateral amount to be added to the loan
    /// @return totalCollateralAmount The total collateral amount after adding collateral
    function addCollateral(
        bytes32 loanId,
        uint collateralAmount,
        bool useFreedCollateral
    )
        external
        returns (uint totalCollateralAmount);

    /// @notice Withdraw freed collateral from caller's account
    /// @param tokenAddress The collateral token address
    /// @param collateralAmount The freed collateral amount
    function withdrawFreedCollateral(address tokenAddress, uint collateralAmount) external;

    /// @notice Return amount of freed collateral for each token in caller's account
    /// @return tokenAddressList A list of token addresses
    /// @return freedCollateralAmountList A list of freed collateral amount for each token
    function getFreedCollaterals()
        external
        view
        returns (
            address[] memory tokenAddressList,
            uint[] memory freedCollateralAmountList
        );

    /// @notice Return details of a loan owned by the caller
    /// @param loanId ID that identifies the loan
    /// @return loanTokenAddress
    /// @return collateralTokenAddress
    /// @return loanTerm
    /// @return loanAmount
    /// @return collateralAmount
    /// @return annualInterestRate
    /// @return interest
    /// @return minCollateralRatio
    /// @return liquidationDiscount
    /// @return alreadyPaidAmount
    /// @return liquidatedAmount
    /// @return soldCollateralAmount
    /// @return remainingDebt
    /// @return createdAt
    /// @return lastInterestUpdatedAt
    /// @return lastRepaidAt
    /// @return lastLiquidatedAt
    /// @return isLiquidatable
    /// @return isOverDue
    /// @return isClose
    function getLoan(
        bytes32 loanId
    )
        external
        view
        returns (
            address loanTokenAddress,
            address collateralTokenAddress,
            uint loanTerm,
            uint loanAmount,
            uint collateralAmount,
            uint annualInterestRate,
            uint interest,
            uint minCollateralRatio,
            uint liquidationDiscount,
            uint alreadyPaidAmount,
            uint liquidatedAmount,
            uint soldCollateralAmount,
            uint remainingDebt,
            uint createdAt,
            uint lastInterestUpdatedAt,
            uint lastRepaidAt,
            uint lastLiquidatedAt,
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
    function getLoans()
        external
        view
        returns (
            bytes32[] memory loanIdList,
            address[] memory loanTokenAddressList,
            address[] memory collateralTokenAddressList,
            uint[] memory loanTermList,
            uint[] memory loanAmountList,
            uint[] memory collateralAmountList,
            uint[] memory annualInterestRateList,
            uint[] memory interestList,
            uint[] memory minCollateralRatioList,
            uint[] memory liquidationDiscountList,
            uint[] memory alreadyPaidAmountList,
            uint[] memory liquidatedAmountList,
            uint[] memory soldCollateralAmountList,
            uint[] memory remainingDebtList,
            uint[] memory createdAtList,
            uint[] memory lastInterestUpdatedAtList,
            uint[] memory lastRepaidAtList,
            uint[] memory lastLiquidatedAtList,
            bool[] memory isLiquidatableList,
            bool[] memory isOverDueList,
            bool[] memory isCloseList
        );

    /// @notice Return a list of enabled loan terms
    /// @return loanTermList A list of enabled loan terms
    function getLoanTerms() external view returns (uint[] memory loanTermList);

    /// @notice Return details for each loan and collateral token pair
    /// @return loanTokenAddressList A list of loan token addresses
    /// @return collateralTokenAddressList A list of collateral token addresses
    /// @return isEnabledList A list of boolean value indicates whether the token pair is enabled
    /// @return collateralCoverageRatioList A list of collateral coverage ratios
    /// @return liquidationDiscountList A list of liquidation discounts
    function getLoanAndCollateralTokenPairs()
        external
        view
        returns (
            address[] memory loanTokenAddressList,
            address[] memory collateralTokenAddressList,
            bool[] memory isEnabledList,
            uint[] memory collateralCoverageRatioList,
            uint[] memory liquidationDiscountList
        );

    /// @notice Return loan interest rates for each token and loan term
    /// @return tokenAddressList A list of token addresses
    /// @return loanTerms A list of loan terms
    /// @return loanInterestRates A list of loan interest rates
    function getLoanInterestRates()
        external
        view
        returns (
            address[] memory tokenAddressList,
            uint[] memory loanTerms,
            uint[] memory loanInterestRates
        );

    /// --- Configuration ---

    /// @notice Set price oracle address
    /// @param priceOracleAddress Price oracle address
    function setPriceOracleAddress(address priceOracleAddress) external;

    /// @notice Set protocol address, which receives protocol reserve.
    /// @param protocolAddress Protocol address
    function setProtocolAddress(address protocolAddress) external;

    /// @notice Set protocol reserve ratio, which determines the percentage
    ///         of interest that goes to protocol reserve.
    /// @param protocolReserveRatio Protocol reserve ratio
    function setProtocolReserveRatio(uint protocolReserveRatio) external;

    /// @notice Lock user actions
    function lockUserActions() external;

    /// @notice Unlock user actions
    function unlockUserActions() external;

    /// @notice Return price oracle address
    /// @return priceOracleAddress Price oracle address
    function getPriceOracleAddress() external view returns (address priceOracleAddress);

    /// @notice Return protocol address
    /// @return protocolAddress Protocol address
    function getProtocolAddress() external view returns (address protocolAddress);

    /// @notice Return protocol reserve ratio
    /// @return protocolReserveRatio Protocol reserve ratio
    function getProtocolReserveRatio() external view returns (uint protocolReserveRatio);

    /// @notice Check if user actions are locked
    /// @param isLocked Return true if user actions are locked, else return false
    function isUserActionsLocked() external view returns (bool isLocked);

    /// --- Account ---

    /// @notice Return a specific general statistic for an account
    /// @param accountAddress Account address
    /// @param key The key to retrieve corresponding stat
    /// @return stat The statistical value
    function getAccountGeneralStat(
        address accountAddress,
        string calldata key
    )
        external
        view
        returns (uint stat);

    /// @notice Return a token-specific statistic for an account
    /// @param accountAddress Account address
    /// @param tokenAddress Token address
    /// @param key The key to retrieve corresponding stat
    /// @return stat The statistical value
    function getAccountTokenStat(
        address accountAddress,
        address tokenAddress,
        string calldata key
    )
        external
        view
        returns (uint stat);
}
