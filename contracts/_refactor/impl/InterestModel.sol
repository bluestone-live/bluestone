pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import '../interface/IInterestModel.sol';
import '../lib/FixedMath.sol';

contract InterestModel is IInterestModel, Ownable {
    using SafeMath for uint256;
    using FixedMath for uint256;

    mapping(address => LoanParameters) _loanParametersByTokenAddress;

    // Parameters to help calculate loan interest rate
    struct LoanParameters {
        uint256 loanInterestRateLowerBound;
        uint256 loanInterestRateUpperBound;
    }

    function getDepositWeight(uint256 amount, uint256 term)
        external
        pure
        returns (uint256)
    {
        return amount.mul(term);
    }

    function getLoanInterestRate(
        address tokenAddress,
        uint256 loanTerm,
        uint256 maxLoanTerm
    ) external view returns (uint256 loanInterestRate) {
        LoanParameters memory params = _loanParametersByTokenAddress[tokenAddress];
        uint256 H = params.loanInterestRateUpperBound;
        uint256 L = params.loanInterestRateLowerBound;

        return H.sub(H.sub(L).mul(loanTerm).div(maxLoanTerm));
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
