pragma solidity ^0.6.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './interface/IInterestModel.sol';


contract InterestModel is IInterestModel, Ownable {
    using SafeMath for uint256;

    mapping(address => LoanParameters) _loanParametersByTokenAddress;

    // Parameters to help calculate loan interest rate
    struct LoanParameters {
        uint256 loanInterestRateLowerBound;
        uint256 loanInterestRateUpperBound;
    }

    function getDepositWeight(uint256 amount, uint256 term)
        external
        override
        pure
        returns (uint256)
    {
        return amount.mul(term);
    }

    function getLoanInterestRate(
        address tokenAddress,
        uint256 loanTerm,
        uint256 maxLoanTerm
    ) external override view returns (uint256 loanInterestRate) {

            LoanParameters memory params
         = _loanParametersByTokenAddress[tokenAddress];
        uint256 H = params.loanInterestRateUpperBound;
        uint256 L = params.loanInterestRateLowerBound;

        return H.sub(H.sub(L).mul(loanTerm).div(maxLoanTerm));
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
