pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '../../oracle/interface/IPriceOracle.sol';
import './IInterestModel.sol';
import './IStruct.sol';


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
    ) external virtual payable returns (bytes32 depositId);

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
        virtual
        view
        returns (uint256[] memory depositTerms);

    /// @notice Return details for each deposit token
    /// @return depositTokenAddressList A list of deposit tokens
    function getDepositTokens()
        external
        virtual
        view
        returns (address[] memory depositTokenAddressList);

    /// @notice Return details about a deposit
    /// @param depositId ID that identifies the deposit
    /// @return depositRecord
    function getDepositRecordById(bytes32 depositId)
        external
        virtual
        view
        returns (IStruct.GetDepositRecordResponse memory depositRecord);

    /// @notice Return details about all deposits
    /// @return depositRecordList
    function getDepositRecordsByAccount(address accountAddress)
        external
        virtual
        view
        returns (IStruct.GetDepositRecordResponse[] memory depositRecordList);

    /// @notice Return whether a deposit can be early withdrew.
    /// @param depositId ID that identifies the deposit
    /// @return isEarlyWithdrawable
    function isDepositEarlyWithdrawable(bytes32 depositId)
        external
        virtual
        view
        returns (bool isEarlyWithdrawable);

    /// --- Loan ---

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
    ) external virtual;

    /// @notice Remove a loan and collateral token pair, e.g., ETH_DAI
    /// @param loanTokenAddress Loan token address
    /// @param collateralTokenAddress collateral token address
    function removeLoanAndCollateralTokenPair(
        address loanTokenAddress,
        address collateralTokenAddress
    ) external virtual;

    /// @dev Remove documentation of return parameters in order to compile
    /// @notice Get maximum loan term
    /// @return maxLoanTerm
    function getMaxLoanTerm()
        external
        virtual
        view
        returns (uint256 maxLoanTerm);

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
    ) external virtual payable returns (bytes32 loanId);

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
        virtual
        payable
        returns (uint256 totalCollateralAmount);

    /// @notice Return basic info of a loan record
    /// @param loanId ID that identifies the loan record
    /// @return loanRecord
    function getLoanRecordById(bytes32 loanId)
        external
        virtual
        view
        returns (IStruct.GetLoanRecordResponse memory loanRecord);

    /// @notice Return details of all loans owned by the caller
    /// @return loanRecordList
    function getLoanRecordsByAccount(address accountAddress)
        external
        virtual
        view
        returns (IStruct.GetLoanRecordResponse[] memory loanRecordList);

    /// @notice Return details for each loan and collateral token pair
    /// @return loanAndCollateralTokenPairList A list of loan and collateral token pairs
    function getLoanAndCollateralTokenPairs()
        external
        virtual
        view
        returns (
            IStruct.LoanAndCollateralTokenPair[] memory loanAndCollateralTokenPairList
        );

    /// @notice Return loan interest rate for given token
    /// @return loanInterestRate loan interest rate
    function getLoanInterestRate(address tokenAddress, uint256 term)
        external
        virtual
        view
        returns (uint256 loanInterestRate);

    /// --- Configuration ---

    function getPoolsByToken(address tokenAddress)
        external
        virtual
        view
        returns (IStruct.getPoolsByTokenResponse[] memory poolList);

    function getPoolById(address tokenAddress, uint256 poolId)
        external
        virtual
        view
        returns (IStruct.Pool memory pool);

    /// @notice Set price oracle address
    /// @param tokenAddress Token address
    /// @param priceOracle Price oracle
    function setPriceOracle(address tokenAddress, IPriceOracle priceOracle)
        external
        virtual;

    /// @notice Set interest model
    /// @param interestModel Interest model
    function setInterestModel(IInterestModel interestModel) external virtual;

    /// @notice Set interest reserve address, which receives protocol reserve.
    /// @param interestReserveAddress Protocol address
    function setInterestReserveAddress(address payable interestReserveAddress)
        external
        virtual;

    /// @notice Set protocol reserve ratio, which determines the percentage
    ///         of interest that goes to protocol reserve.
    /// @param protocolReserveRatio Protocol reserve ratio
    function setProtocolReserveRatio(uint256 protocolReserveRatio)
        external
        virtual;

    /// @notice Set the maximum fee ratio for distributors
    /// @param depositDistributorFeeRatio deposit distributor fee ratio
    /// @param loanDistributorFeeRatio loan fee ratio
    function setMaxDistributorFeeRatios(
        uint256 depositDistributorFeeRatio,
        uint256 loanDistributorFeeRatio
    ) external virtual;

    /// @notice Set balance cap for a token
    /// @param tokenAddress Token address
    /// @param balanceCap Maximum balance allowed
    function setBalanceCap(address tokenAddress, uint256 balanceCap)
        external
        virtual;

    /// @notice Return USD price of a token
    /// @param tokenAddress Token address
    /// @return tokenPrice Token price in USD
    function getTokenPrice(address tokenAddress)
        external
        virtual
        view
        returns (uint256 tokenPrice);

    /// @notice Return interest reserve address
    /// @return interestReserveAddress interest reserve address
    function getInterestReserveAddress()
        external
        virtual
        view
        returns (address interestReserveAddress);

    /// @notice Return interest model address
    /// @return interestModelAddress Interest model address
    function getInterestModelAddress()
        external
        virtual
        view
        returns (address interestModelAddress);

    /// @notice Return protocol reserve ratio
    /// @return protocolReserveRatio Protocol reserve ratio
    function getProtocolReserveRatio()
        external
        virtual
        view
        returns (uint256 protocolReserveRatio);

    /// @notice Return the maximum fee ratio for distributors
    /// @return depositDistributorFeeRatio
    /// @return loanDistributorFeeRatio
    function getMaxDistributorFeeRatios()
        external
        virtual
        view
        returns (
            uint256 depositDistributorFeeRatio,
            uint256 loanDistributorFeeRatio
        );

    /// @notice Return the balance cap for a token
    /// @param tokenAddress Token address
    /// @return balanceCap Maximum balance allowed
    function getBalanceCap(address tokenAddress)
        external
        virtual
        view
        returns (uint256 balanceCap);
}
