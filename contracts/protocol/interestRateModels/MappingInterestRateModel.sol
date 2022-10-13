// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import '../interface/IInterestRateModel.sol';

contract MappingInterestRateModel is IInterestRateModel, Ownable {
    mapping(address => LoanParameters) _loanParametersByTokenAddress;

    struct LoanParameters {
        uint256[] termList;
        uint256[] interestRateList;
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
            'InterestRateModel: Loan term exceeds max value'
        );
        LoanParameters storage loanParameters = _loanParametersByTokenAddress[
            tokenAddress
        ];
        for (uint256 i = 0; i < loanParameters.termList.length; i++) {
            if (loanParameters.termList[i] == loanTerm) {
                return loanParameters.interestRateList[i];
            }
        }
        revert("InterestRateModel: Loan interest rate haven't setted");
    }

    function getLoanParameters(address tokenAddress)
        external
        view
        returns (LoanParameters memory)
    {
        return _loanParametersByTokenAddress[tokenAddress];
    }

    function setLoanParameters(
        address tokenAddress,
        uint256[] calldata loanTerms,
        uint256[] calldata loanInterestRates
    ) external onlyOwner {
        require(
            loanTerms.length == loanInterestRates.length,
            'InterestRateModel: The length of Terms array must equal to InterestRate array'
        );
        LoanParameters storage loanParameters = _loanParametersByTokenAddress[
            tokenAddress
        ];
        loanParameters.termList = loanTerms;
        loanParameters.interestRateList = loanInterestRates;
    }
}
