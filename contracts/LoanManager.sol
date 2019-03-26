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

    /// Calculate the total amount to be loaned from a pool group and start loaning from the 
    /// <loan-term>th pool, incrementing the term until the final pool has been reached.
    function loanFromPoolGroup(uint8 depositTerm, uint8 loanTerm, uint loanAmount, uint loanId) private {
        PoolGroup poolGroup = _liquidityPools.poolGroups(depositTerm);
        uint coefficient = _config.getCoefficient(depositTerm, loanTerm);
        uint remainingLoanAmount = coefficient.mulFixed(loanAmount);

        /// Assuming the calculated loan amount is always not more than the amount the 
        /// pool group can provide. TODO: add a check here just in case.

        uint8 term = loanTerm;

        while (remainingLoanAmount > 0 && term <= depositTerm) {
            uint loanableAmountFromPool = poolGroup.getLoanableAmount(term);
            uint loanAmountFromPool = Math.min(remainingLoanAmount, loanableAmountFromPool);
            poolGroup.loan(term, loanAmountFromPool);
            loans[loanId].setRecord(depositTerm, term, loanAmountFromPool);
            remainingLoanAmount = remainingLoanAmount.sub(loanAmountFromPool);
            term++;
        }
    }
}
