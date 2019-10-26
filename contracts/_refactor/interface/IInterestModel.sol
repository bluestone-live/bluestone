pragma solidity ^0.5.0;

contract IInterestModel {
    function getDepositWeight(uint256 amount, uint256 term)
        external
        pure
        returns (uint256 depositWeight);

    function getLoanInterestRate(
        address tokenAddress,
        uint256 loanTerm,
        uint256 maxTerm
    ) external view returns (uint256 loanInterestRate);
}
