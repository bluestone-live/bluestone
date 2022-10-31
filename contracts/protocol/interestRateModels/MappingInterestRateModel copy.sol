// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import '../interface/IInterestRateModel.sol';

contract MappingInterestRateModel is IInterestRateModel, Ownable {
    mapping(address => InterestRateDetail) _interestRateDetailByTokenAddress;

    struct InterestRateDetail {
        uint256[] termList;
        mapping(uint256 => uint256) interestRateByTerm;
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
        InterestRateDetail
            storage interestRateDetail = _interestRateDetailByTokenAddress[
                tokenAddress
            ];
        require(
            _isTermExist(interestRateDetail, loanTerm),
            "InterestRateModel: Loan interest rate haven't set"
        );
        return interestRateDetail.interestRateByTerm[loanTerm];
    }

    function getAllRates(address tokenAddress)
        external
        view
        returns (uint256[] memory, uint256[] memory)
    {
        InterestRateDetail
            storage interestRateDetail = _interestRateDetailByTokenAddress[
                tokenAddress
            ];

        uint256[] memory interestRateList = interestRateDetail.termList;
        for (uint256 i = 0; i < interestRateList.length; i++) {
            interestRateList[i] = interestRateDetail.interestRateByTerm[
                interestRateDetail.termList[i]
            ];
        }

        return (interestRateDetail.termList, interestRateList);
    }

    function setRates(
        address tokenAddress,
        uint256[] calldata loanTerms,
        uint256[] calldata loanInterestRates
    ) external onlyOwner {
        require(
            loanTerms.length == loanInterestRates.length,
            'InterestRateModel: The length of Terms array must equal to InterestRate array'
        );
        InterestRateDetail
            storage interestRateDetail = _interestRateDetailByTokenAddress[
                tokenAddress
            ];
        _clearMapping(interestRateDetail);
        interestRateDetail.termList = loanTerms;
        for (uint256 i = 0; i < loanTerms.length; i++) {
            interestRateDetail.interestRateByTerm[
                loanTerms[i]
            ] = loanInterestRates[i];
        }
    }

    function _isTermExist(
        InterestRateDetail storage interestRateDetail,
        uint256 loanTerm
    ) private view returns (bool) {
        for (uint256 i = 0; i < interestRateDetail.termList.length; i++) {
            if (interestRateDetail.termList[i] == loanTerm) {
                return true;
            }
        }
        return false;
    }

    function _clearMapping(InterestRateDetail storage interestRateDetail)
        private
    {
        for (uint256 i = 0; i < interestRateDetail.termList.length; i++) {
            delete interestRateDetail.interestRateByTerm[
                interestRateDetail.termList[i]
            ];
        }
    }
}
