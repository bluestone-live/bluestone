// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import '../interface/IInterestRateModel.sol';

contract LinearInterestRateModel is IInterestRateModel, Ownable {
    mapping(address => LoanParameters) _loanParametersByTokenAddress;

    // Parameters to help calculate loan interest rate
    struct LoanParameters {
        uint256 loanInterestRateLowerBound;
        uint256 loanInterestRateUpperBound;
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
        LoanParameters memory params = _loanParametersByTokenAddress[
            tokenAddress
        ];
        uint256 H = params.loanInterestRateUpperBound;
        uint256 L = params.loanInterestRateLowerBound;

        return H - (((H - L) * loanTerm) / maxLoanTerm);
    }

    function getLoanParameters(address tokenAddress)
        external
        view
        returns (
            uint256 loanInterestRateLowerBound,
            uint256 loanInterestRateUpperBound
        )
    {
        return (
            _loanParametersByTokenAddress[tokenAddress]
                .loanInterestRateLowerBound,
            _loanParametersByTokenAddress[tokenAddress]
                .loanInterestRateUpperBound
        );
    }

    function setLoanParameters(
        address tokenAddress,
        uint256 loanInterestRateLowerBound,
        uint256 loanInterestRateUpperBound
    ) external onlyOwner {
        _loanParametersByTokenAddress[tokenAddress] = LoanParameters({
            loanInterestRateLowerBound: loanInterestRateLowerBound,
            loanInterestRateUpperBound: loanInterestRateUpperBound
        });
    }
}
