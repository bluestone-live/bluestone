// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;

import '../../oracle/interface/IPriceOracle.sol';
import './IInterestRateModel.sol';
import './IStruct.sol';

/// @title Interface for the main contract
interface IProtocol {
    /// Admin functions

    /// @notice Pause the contract
    function pause() external;

    /// @notice Unpause the contract
    function unpause() external;

    /// @notice Enable a deposit term
    /// @param depositTerm Deposit term
    function enableDepositTerm(uint256 depositTerm) external;

    /// @notice Enable deposit terms
    /// @param depositTerms Deposit terms
    function enableDepositTerms(uint256[] calldata depositTerms) external;

    /// @notice Disable a deposit term
    /// @param depositTerm  Deposit term
    function disableDepositTerm(uint256 depositTerm) external;

    /// @notice Disable deposit terms
    /// @param depositTerms  Deposit terms
    function disableDepositTerms(uint256[] calldata depositTerms) external;

    /// @notice Enable an ERC20 token for deposit
    /// @param tokenAddress Token address
    function enableDepositToken(address tokenAddress) external;

    /// @notice Disable an token, i.e., ERC20 token, for deposit
    /// @param tokenAddress Token address
    function disableDepositToken(address tokenAddress) external;

    /// @notice Set a loan and collateral token pair, e.g., ETH_DAI.
    /// @param loanTokenAddress Loan token address
    /// @param collateralTokenAddress Collateral token address
    /// @param minCollateralCoverageRatio Minimum collateral coverage ratio
    /// @param liquidationDiscount Liquidation Discount
    function setLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress,
        uint256 minCollateralCoverageRatio,
        uint256 liquidationDiscount
    ) external;

    /// @notice Remove a loan and collateral token pair, e.g., ETH_DAI
    /// @param loanTokenAddress Loan token address
    /// @param collateralTokenAddress collateral token address
    function removeLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external;

    /// @notice Set price oracle address
    /// @param tokenAddress Token address
    /// @param priceOracle Price oracle
    function setPriceOracle(address tokenAddress, IPriceOracle priceOracle)
        external;

    /// @notice Set interest model
    /// @param interestRateModel Interest model
    function setInterestRateModel(IInterestRateModel interestRateModel)
        external;

    /// @notice Set interest reserve address, which receives protocol reserve.
    /// @param interestReserveAddress Protocol address
    function setInterestReserveAddress(address payable interestReserveAddress)
        external;

    /// @notice Set protocol reserve ratio, which determines the percentage
    ///         of interest that goes to protocol reserve.
    /// @param protocolReserveRatio Protocol reserve ratio
    function setProtocolReserveRatio(uint256 protocolReserveRatio) external;

    /// @notice Set the maximum fee ratio for distributors
    /// @param depositDistributorFeeRatio deposit distributor fee ratio
    /// @param loanDistributorFeeRatio loan fee ratio
    function setMaxDistributorFeeRatios(
        uint256 depositDistributorFeeRatio,
        uint256 loanDistributorFeeRatio
    ) external;

    /// @notice Set balance cap for a token
    /// @param tokenAddress Token address
    /// @param balanceCap Maximum balance allowed
    function setBalanceCap(address tokenAddress, uint256 balanceCap) external;

    /// Lender functions

    /// @notice Deposit token with specific term and amount
    /// @param tokenAddress Token address
    /// @param depositAmount Deposit amount (overwritten by msg.value if deposit token is ETH)
    /// @param depositTerm Deposit term
    /// @param distributorAddress distributor account address
    /// @return depositId ID that identifies the deposit
    function deposit(
        address tokenAddress,
        uint256 depositAmount,
        uint256 depositTerm,
        address payable distributorAddress
    ) external payable returns (bytes32 depositId);

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

    /// Borrower functions

    /// @notice Borrow token in a specific term
    /// @param loanTokenAddress token to borrow
    /// @param collateralTokenAddress token to collateralize the loan
    /// @param loanAmount Amount to borrow
    /// @param collateralAmount Amount to collateralize (overwritten by msg.value if collateral token is ETH)
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
    ) external payable returns (bytes32 loanId);

    /// @notice Pay back a specific amount of loan
    /// @param loanId ID that identifies the loan
    /// @param repayAmount Amount to repay (overwritten by msg.value if loan token is ETH)
    /// @return remainingDebt remaining debt of the loan
    function repayLoan(bytes32 loanId, uint256 repayAmount)
        external
        payable
        returns (uint256 remainingDebt);

    /// @notice Add collateral to a loan
    /// @param loanId ID that identifies the loan
    /// @param collateralAmount The collateral amount to be added to the loan (overwritten by msg.value if collateral token is ETH)
    /// @return totalCollateralAmount The total collateral amount after adding collateral
    function addCollateral(bytes32 loanId, uint256 collateralAmount)
        external
        payable
        returns (uint256 totalCollateralAmount);

    /// @notice Subtract collateral from a loan
    /// @param loanId ID that identifies the loan
    /// @param collateralAmount The collateral amount to be subtracted from the loan
    /// @return totalCollateralAmount The total collateral amount after subtracting collateral
    function subtractCollateral(bytes32 loanId, uint256 collateralAmount)
        external
        returns (uint256 totalCollateralAmount);

    /// Liquidator functions

    /// @notice Liquidate a loan that is under-collateralized or defaulted
    /// @param loanId ID that identifies the loan
    /// @param liquidateAmount The amount requested to liquidate. If the amount
    ///        is greater than the remaining debt of the loan, it will
    ///        liquidate the full remaining debt.
    ///        (overwritten by msg.value if loan token is ETH)
    /// @return remainingCollateral The remaining amount of collateral after liquidation
    /// @return liquidatedAmount The amount of debt that is liquidated.
    function liquidateLoan(bytes32 loanId, uint256 liquidateAmount)
        external
        payable
        returns (uint256 remainingCollateral, uint256 liquidatedAmount);

    /// Getters about deposit

    /// @notice Return enabled deposit terms
    /// @return depositTerms A list of enabled deposit terms
    function getDepositTerms()
        external
        view
        returns (uint256[] memory depositTerms);

    /// @notice Return details for each deposit token
    /// @return depositTokenAddressList A list of deposit tokens
    function getDepositTokens()
        external
        view
        returns (address[] memory depositTokenAddressList);

    /// @notice Return details about a deposit
    /// @param depositId ID that identifies the deposit
    /// @return depositRecord
    function getDepositRecordById(bytes32 depositId)
        external
        view
        returns (IStruct.GetDepositRecordResponse memory depositRecord);

    /// @notice Return details about all deposits
    /// @return depositRecordList
    function getDepositRecordsByAccount(address accountAddress)
        external
        view
        returns (IStruct.GetDepositRecordResponse[] memory depositRecordList);

    /// @notice Return whether a deposit can be early withdrew.
    /// @param depositId ID that identifies the deposit
    /// @return isEarlyWithdrawable
    function isDepositEarlyWithdrawable(bytes32 depositId)
        external
        view
        returns (bool isEarlyWithdrawable);

    /// Getters about loan

    /// @notice Return details for each loan and collateral token pair
    /// @return loanAndCollateralTokenPairList A list of loan and collateral token pairs
    function getLoanAndCollateralTokenPairs()
        external
        view
        returns (
            IStruct.LoanAndCollateralTokenPair[]
                memory loanAndCollateralTokenPairList
        );

    /// @dev Remove documentation of return parameters in order to compile
    /// @notice Get maximum loan term
    /// @return maxLoanTerm
    function getMaxLoanTerm() external view returns (uint256 maxLoanTerm);

    /// @notice Return loan interest rate for given token
    /// @return loanInterestRate loan interest rate
    function getLoanInterestRate(address tokenAddress, uint256 term)
        external
        view
        returns (uint256 loanInterestRate);

    /// @notice Return basic info of a loan record
    /// @param loanId ID that identifies the loan record
    /// @return loanRecord
    function getLoanRecordById(bytes32 loanId)
        external
        view
        returns (IStruct.GetLoanRecordResponse memory loanRecord);

    /// @notice Return details of all loans owned by the caller
    /// @return loanRecordList
    function getLoanRecordsByAccount(address accountAddress)
        external
        view
        returns (IStruct.GetLoanRecordResponse[] memory loanRecordList);

    /// Getters about liquidity pools

    /// @notice Return details of all pools of a given token
    /// @return poolList
    function getPoolsByToken(address tokenAddress)
        external
        view
        returns (IStruct.GetPoolsByTokenResponse[] memory poolList);

    function getPoolById(address tokenAddress, uint256 poolId)
        external
        view
        returns (IStruct.Pool memory pool);

    /// Miscellaneous functions

    /// @notice Return the balance cap for a token
    /// @param tokenAddress Token address
    /// @return balanceCap Maximum balance allowed
    function getBalanceCap(address tokenAddress)
        external
        view
        returns (uint256 balanceCap);

    /// @notice Return interest model address
    /// @return interestRateModelAddress Interest model address
    function getInterestRateModelAddress()
        external
        view
        returns (address interestRateModelAddress);

    /// @notice Return USD price of a token
    /// @param tokenAddress Token address
    /// @return tokenPrice Token price in USD
    function getTokenPrice(address tokenAddress)
        external
        view
        returns (uint256 tokenPrice);

    /// @notice Return the maximum fee ratio for distributors
    /// @return depositDistributorFeeRatio
    /// @return loanDistributorFeeRatio
    function getMaxDistributorFeeRatios()
        external
        view
        returns (
            uint256 depositDistributorFeeRatio,
            uint256 loanDistributorFeeRatio
        );

    /// @notice Return protocol reserve ratio
    /// @return protocolReserveRatio Protocol reserve ratio
    function getProtocolReserveRatio()
        external
        view
        returns (uint256 protocolReserveRatio);

    /// @notice Return interest reserve address
    /// @return interestReserveAddress interest reserve address
    function getInterestReserveAddress()
        external
        view
        returns (address interestReserveAddress);
}
