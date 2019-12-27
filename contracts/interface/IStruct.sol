pragma solidity ^0.6.0;

interface IStruct {
    struct DepositRecord {
        bytes32 depositId;
        address ownerAddress;
        address tokenAddress;
        uint256 depositTerm;
        uint256 depositAmount;
        uint256 poolId;
        uint256 createdAt;
        uint256 maturedAt;
        uint256 withdrewAt;
        uint256 weight;
        address distributorAddress;
    }

    struct LoanRecord {
        bool isClosed;
        bytes32 loanId;
        address ownerAddress;
        address loanTokenAddress;
        address collateralTokenAddress;
        uint256 loanAmount;
        uint256 collateralAmount;
        uint256 loanTerm;
        uint256 annualInterestRate;
        uint256 interest;
        uint256 minCollateralCoverageRatio;
        uint256 liquidationDiscount;
        uint256 alreadyPaidAmount;
        uint256 liquidatedAmount;
        uint256 soldCollateralAmount;
        uint256 createdAt;
        uint256 lastInterestUpdatedAt;
        uint256 lastRepaidAt;
        uint256 lastLiquidatedAt;
        address distributorAddress;
        uint256 distributorInterest;
    }

}
