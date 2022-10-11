// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import './interface/IInterestModel.sol';

contract InterestModel is IInterestModel, Ownable {
    mapping(address => LoanParameters) _loanParametersByTokenAddress;

    struct LoanParameters {
        uint256[] loanTerms;
        mapping(uint256 => uint256) interestRateByLoanTerm;
    }

    function getDepositWeight(uint256 amount, uint256 term)
        external
        pure
        override
        returns (uint256)
    {
        return amount * term;
    }

    function getLoanInterestRate(
        address tokenAddress,
        uint256 loanTerm,
        uint256 maxLoanTerm
    ) external view override returns (uint256 loanInterestRate) {
        require(
            loanTerm <= maxLoanTerm,
            'InterestModel: Loan term exceeds max value'
        );
        require(
            !_isLoanTermExist(tokenAddress, loanTerm),
            "InterestModel: Loan interest rate haven't setted"
        );
        return
            _loanParametersByTokenAddress[tokenAddress].interestRateByLoanTerm[
                loanTerm
            ];
    }

    function getLoanParameters(address tokenAddress)
        external
        view
        returns (uint256[] memory loanTerms, uint256[] memory loanInterestRates)
    {
        LoanParameters storage loanParameters = _loanParametersByTokenAddress[
            tokenAddress
        ];
        loanTerms = loanParameters.loanTerms;
        for (uint256 i = 0; i < loanParameters.loanTerms.length; i++) {
            loanInterestRates[i] = loanParameters.interestRateByLoanTerm[
                loanParameters.loanTerms[i]
            ];
        }
    }

    function setLoanParameters(
        address tokenAddress,
        uint256 loanTerm,
        uint256 loanInterestRate
    ) external onlyOwner {
        LoanParameters storage loanParameters = _loanParametersByTokenAddress[
            tokenAddress
        ];
        if (!_isLoanTermExist(tokenAddress, loanTerm)) {
            loanParameters.loanTerms.push(loanTerm);
        }
        loanParameters.interestRateByLoanTerm[loanTerm] = loanInterestRate;
    }

    function _isLoanTermExist(address tokenAddress, uint256 loanTerm)
        private
        view
        returns (bool)
    {
        LoanParameters storage loanParameters = _loanParametersByTokenAddress[
            tokenAddress
        ];
        for (uint256 i = 0; i < loanParameters.loanTerms.length; i++) {
            if (loanParameters.loanTerms[i] == loanTerm) {
                return true;
            }
        }
        return false;
    }
}
