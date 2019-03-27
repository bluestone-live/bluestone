pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "./LiquidityPools.sol";
import "./PoolGroup.sol";
import "./FixedMath.sol";
import "./Configuration.sol";
import "./Loan.sol";


contract LoanManager {
    using SafeMath for uint;
    using FixedMath for uint;

    LiquidityPools private _liquidityPools;
    Configuration private _config;

    uint private _loanId;
    mapping(uint => Loan) private loans;

    constructor(LiquidityPools liquidityPools, address config) public {
        _liquidityPools = liquidityPools;
        _config = Configuration(config);
    }

    function loan(address user, uint8 loanTerm, uint loanAmount, uint collateralAmount) external {
        loans[_loanId] = new Loan(user, loanTerm, loanAmount, collateralAmount);

        if (loanTerm == 1) {
            loanFromPoolGroup(1, loanTerm, loanAmount, _loanId);
            loanFromPoolGroup(7, loanTerm, loanAmount, _loanId);
            loanFromPoolGroup(30, loanTerm, loanAmount, _loanId);
        } else if (loanTerm == 3 || loanTerm == 7) {
            loanFromPoolGroup(7, loanTerm, loanAmount, _loanId);
            loanFromPoolGroup(30, loanTerm, loanAmount, _loanId);
        } else if (loanTerm == 30) {
            loanFromPoolGroup(30, loanTerm, loanAmount, _loanId);
        }

        _loanId++;
    }

    function addCollateral(address user, uint loanId, uint amount) external {
        require(user == loans[loanId].owner());

        loans[loanId].addCollateral(amount);
    }

    function loanFromPoolGroup(uint8 depositTerm, uint8 loanTerm, uint loanAmount, uint loanId) private {
        PoolGroup poolGroup = _liquidityPools.poolGroups(depositTerm);
        uint coefficient = _config.getCoefficient(depositTerm, loanTerm);

        // Calculate the total amount to be loaned from this pool group 
        uint remainingLoanAmount = coefficient.mulFixed(loanAmount);

        /// Assuming the calculated loan amount is always not more than the amount the 
        /// pool group can provide. TODO: add a check here just in case.

        uint8 poolGroupIndex = loanTerm - 1;
        uint8 poolGroupLength = depositTerm;

        /// Incrementing the pool group index and loaning from each pool until loan amount is fulfilled.
        while (remainingLoanAmount > 0 && poolGroupIndex < poolGroupLength) {
            uint loanableAmount = poolGroup.getLoanableAmountFromPool(poolGroupIndex);
            uint loanedAmount = Math.min(remainingLoanAmount, loanableAmount);
            poolGroup.loanFromPool(poolGroupIndex, loanedAmount);
            loans[loanId].setRecord(depositTerm, poolGroupIndex, loanedAmount);
            remainingLoanAmount = remainingLoanAmount.sub(loanedAmount);
            poolGroupIndex++;
        }
    }
}
