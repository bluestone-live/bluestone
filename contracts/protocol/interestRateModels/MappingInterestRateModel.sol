// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import '../interface/IInterestRateModel.sol';

contract MappingInterestRateModel is IInterestRateModel, Ownable {
    mapping(address => InterestRateDetail) _interestRateDetailByTokenAddress;
    mapping(address => bool) private _isTokenAvailable;

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
        require(
            _isTokenAvailable[tokenAddress],
            'InterestRateModel: token is not enabled'
        );
        InterestRateDetail
            storage interestRateDetail = _interestRateDetailByTokenAddress[
                tokenAddress
            ];
        uint256 rate = interestRateDetail.interestRateByTerm[loanTerm];
        require(rate != 0, 'InterestRateModel: term is not enabled');
        return rate;
    }

    function getAllRates(address tokenAddress)
        external
        view
        returns (uint256[] memory termList, uint256[] memory interestRateList)
    {
        InterestRateDetail
            storage interestRateDetail = _interestRateDetailByTokenAddress[
                tokenAddress
            ];

        termList = interestRateDetail.termList;

        interestRateList = new uint256[](interestRateDetail.termList.length);
        for (uint256 i = 0; i < interestRateList.length; i++) {
            interestRateList[i] = interestRateDetail.interestRateByTerm[
                interestRateDetail.termList[i]
            ];
        }
    }

    function setRates(
        address tokenAddress,
        uint256[] calldata loanTerms,
        uint256[] calldata loanInterestRates
    ) external onlyOwner {
        require(
            loanTerms.length == loanInterestRates.length,
            'InterestRateModel: the length of loanTerms array must equal to loanInterestRates array'
        );
        InterestRateDetail
            storage interestRateDetail = _interestRateDetailByTokenAddress[
                tokenAddress
            ];
        interestRateDetail.termList = loanTerms;
        for (uint256 i = 0; i < loanTerms.length; i++) {
            uint256 rate = loanInterestRates[i];
            require(
                rate > 0,
                'InterestRateModel: loan interest rate can not be zero'
            );
            interestRateDetail.interestRateByTerm[loanTerms[i]] = rate;
        }
        _isTokenAvailable[tokenAddress] = true;
    }
}
